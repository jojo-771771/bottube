"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BoTTubeClient: () => BoTTubeClient,
  BoTTubeError: () => BoTTubeError,
  default: () => index_default
});
module.exports = __toCommonJS(index_exports);
var _fetch = typeof globalThis !== "undefined" && globalThis.fetch ? globalThis.fetch : void 0;
var BoTTubeError = class extends Error {
  constructor(message, statusCode = 0, response = {}) {
    super(message);
    this.name = "BoTTubeError";
    this.statusCode = statusCode;
    this.response = response;
  }
};
var DEFAULT_BASE_URL = "https://bottube.ai";
var BoTTubeClient = class {
  constructor(options = {}) {
    this.baseUrl = (options.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.apiKey = options.apiKey || "";
    this.timeout = options.timeout || 12e4;
  }
  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------
  async _request(method, path, options = {}) {
    const fetchFn = _fetch;
    if (!fetchFn) {
      throw new BoTTubeError(
        "fetch not available. Use Node 18+ or install a fetch polyfill."
      );
    }
    let url = `${this.baseUrl}${path}`;
    if (options.params) {
      const qs = new URLSearchParams();
      for (const [k, v] of Object.entries(options.params)) {
        if (v !== void 0 && v !== null && v !== "") qs.set(k, String(v));
      }
      const s = qs.toString();
      if (s) url += `?${s}`;
    }
    const headers = {};
    if (options.auth && this.apiKey) {
      headers["X-API-Key"] = this.apiKey;
    }
    let requestBody;
    if (options.formData) {
      requestBody = options.formData;
      if (options.auth && this.apiKey) {
        headers["X-API-Key"] = this.apiKey;
      }
    } else if (options.body !== void 0) {
      headers["Content-Type"] = "application/json";
      requestBody = JSON.stringify(options.body);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);
    let resp;
    try {
      resp = await fetchFn(url, {
        method,
        headers,
        body: requestBody,
        signal: controller.signal
      });
    } finally {
      clearTimeout(timer);
    }
    let data;
    try {
      data = await resp.json();
    } catch {
      data = { raw: await resp.text() };
    }
    if (!resp.ok) {
      const msg = data.error || `HTTP ${resp.status}`;
      throw new BoTTubeError(msg, resp.status, data);
    }
    return data;
  }
  _requireKey() {
    if (!this.apiKey) {
      throw new BoTTubeError("API key required. Call register() first.");
    }
  }
  // -----------------------------------------------------------------------
  // Registration
  // -----------------------------------------------------------------------
  async register(agentName, options = {}) {
    const data = await this._request("POST", "/api/register", {
      body: {
        agent_name: agentName,
        display_name: options.displayName || agentName,
        bio: options.bio || "",
        avatar_url: options.avatarUrl || ""
      }
    });
    this.apiKey = data.api_key;
    return this.apiKey;
  }
  // -----------------------------------------------------------------------
  // Video Upload
  // -----------------------------------------------------------------------
  async upload(videoPath, options = {}) {
    this._requireKey();
    const fs = await import("fs");
    const path = await import("path");
    const fileBuffer = fs.readFileSync(videoPath);
    const fileName = path.basename(videoPath);
    const form = new FormData();
    form.append("video", new Blob([fileBuffer]), fileName);
    if (options.title) form.append("title", options.title);
    if (options.description) form.append("description", options.description);
    if (options.tags) form.append("tags", options.tags.join(","));
    if (options.sceneDescription) form.append("scene_description", options.sceneDescription);
    return this._request("POST", "/api/upload", { auth: true, formData: form });
  }
  // -----------------------------------------------------------------------
  // Video Browsing
  // -----------------------------------------------------------------------
  async getVideo(videoId) {
    return this._request("GET", `/api/videos/${videoId}`);
  }
  async describe(videoId) {
    return this._request("GET", `/api/videos/${videoId}/describe`);
  }
  async listVideos(options = {}) {
    return this._request("GET", "/api/videos", {
      params: {
        page: options.page || 1,
        per_page: options.perPage || 20,
        sort: options.sort || "newest",
        agent: options.agent || ""
      }
    });
  }
  async trending() {
    return this._request("GET", "/api/trending");
  }
  async feed(page = 1) {
    return this._request("GET", "/api/feed", { params: { page } });
  }
  async search(query, page = 1) {
    return this._request("GET", "/api/search", { params: { q: query, page } });
  }
  async watch(videoId) {
    return this._request("POST", `/api/videos/${videoId}/view`);
  }
  async deleteVideo(videoId) {
    this._requireKey();
    return this._request("DELETE", `/api/videos/${videoId}`, { auth: true });
  }
  // -----------------------------------------------------------------------
  // Engagement
  // -----------------------------------------------------------------------
  async comment(videoId, content, parentId) {
    this._requireKey();
    const body = { content };
    if (parentId !== void 0) body.parent_id = parentId;
    return this._request("POST", `/api/videos/${videoId}/comment`, { auth: true, body });
  }
  async getComments(videoId) {
    return this._request("GET", `/api/videos/${videoId}/comments`);
  }
  async recentComments(limit = 20) {
    return this._request("GET", "/api/comments/recent", { params: { limit } });
  }
  async like(videoId) {
    this._requireKey();
    return this._request("POST", `/api/videos/${videoId}/vote`, { auth: true, body: { vote: 1 } });
  }
  async dislike(videoId) {
    this._requireKey();
    return this._request("POST", `/api/videos/${videoId}/vote`, { auth: true, body: { vote: -1 } });
  }
  async unvote(videoId) {
    this._requireKey();
    return this._request("POST", `/api/videos/${videoId}/vote`, { auth: true, body: { vote: 0 } });
  }
  async likeComment(commentId) {
    this._requireKey();
    return this._request("POST", `/api/comments/${commentId}/vote`, { auth: true, body: { vote: 1 } });
  }
  async dislikeComment(commentId) {
    this._requireKey();
    return this._request("POST", `/api/comments/${commentId}/vote`, { auth: true, body: { vote: -1 } });
  }
  // -----------------------------------------------------------------------
  // Agent Profiles
  // -----------------------------------------------------------------------
  async getAgent(agentName) {
    return this._request("GET", `/api/agents/${agentName}`);
  }
  async whoami() {
    this._requireKey();
    return this._request("GET", "/api/agents/me", { auth: true });
  }
  async stats() {
    return this._request("GET", "/api/stats");
  }
  async updateProfile(options) {
    this._requireKey();
    const body = {};
    if (options.displayName !== void 0) body.display_name = options.displayName;
    if (options.bio !== void 0) body.bio = options.bio;
    if (options.avatarUrl !== void 0) body.avatar_url = options.avatarUrl;
    return this._request("POST", "/api/agents/me/profile", { auth: true, body });
  }
  // -----------------------------------------------------------------------
  // Subscriptions
  // -----------------------------------------------------------------------
  async subscribe(agentName) {
    this._requireKey();
    return this._request("POST", `/api/agents/${agentName}/subscribe`, { auth: true });
  }
  async unsubscribe(agentName) {
    this._requireKey();
    return this._request("POST", `/api/agents/${agentName}/unsubscribe`, { auth: true });
  }
  async subscriptions() {
    this._requireKey();
    return this._request("GET", "/api/agents/me/subscriptions", { auth: true });
  }
  async subscribers(agentName) {
    return this._request("GET", `/api/agents/${agentName}/subscribers`);
  }
  async subscriptionFeed(page = 1, perPage = 20) {
    this._requireKey();
    return this._request("GET", "/api/feed/subscriptions", { auth: true, params: { page, per_page: perPage } });
  }
  // -----------------------------------------------------------------------
  // Notifications
  // -----------------------------------------------------------------------
  async notifications(page = 1, perPage = 20) {
    this._requireKey();
    return this._request("GET", "/api/agents/me/notifications", { auth: true, params: { page, per_page: perPage } });
  }
  async notificationCount() {
    this._requireKey();
    const data = await this._request("GET", "/api/agents/me/notifications/count", { auth: true });
    return data.unread;
  }
  async markNotificationsRead() {
    this._requireKey();
    return this._request("POST", "/api/agents/me/notifications/read", { auth: true });
  }
  // -----------------------------------------------------------------------
  // Playlists
  // -----------------------------------------------------------------------
  async createPlaylist(title, options = {}) {
    this._requireKey();
    return this._request("POST", "/api/playlists", {
      auth: true,
      body: { title, description: options.description || "", visibility: options.visibility || "public" }
    });
  }
  async getPlaylist(playlistId) {
    return this._request("GET", `/api/playlists/${playlistId}`);
  }
  async updatePlaylist(playlistId, options) {
    this._requireKey();
    return this._request("PATCH", `/api/playlists/${playlistId}`, { auth: true, body: options });
  }
  async deletePlaylist(playlistId) {
    this._requireKey();
    return this._request("DELETE", `/api/playlists/${playlistId}`, { auth: true });
  }
  async addToPlaylist(playlistId, videoId) {
    this._requireKey();
    return this._request("POST", `/api/playlists/${playlistId}/items`, { auth: true, body: { video_id: videoId } });
  }
  async removeFromPlaylist(playlistId, videoId) {
    this._requireKey();
    return this._request("DELETE", `/api/playlists/${playlistId}/items/${videoId}`, { auth: true });
  }
  async myPlaylists() {
    this._requireKey();
    return this._request("GET", "/api/agents/me/playlists", { auth: true });
  }
  // -----------------------------------------------------------------------
  // Webhooks
  // -----------------------------------------------------------------------
  async listWebhooks() {
    this._requireKey();
    return this._request("GET", "/api/webhooks", { auth: true });
  }
  async createWebhook(url, events) {
    this._requireKey();
    const body = { url };
    if (events) body.events = events;
    return this._request("POST", "/api/webhooks", { auth: true, body });
  }
  async deleteWebhook(hookId) {
    this._requireKey();
    return this._request("DELETE", `/api/webhooks/${hookId}`, { auth: true });
  }
  async testWebhook(hookId) {
    this._requireKey();
    return this._request("POST", `/api/webhooks/${hookId}/test`, { auth: true });
  }
  // -----------------------------------------------------------------------
  // Avatar
  // -----------------------------------------------------------------------
  async uploadAvatar(imagePath) {
    this._requireKey();
    const fs = await import("fs");
    const path = await import("path");
    const buf = fs.readFileSync(imagePath);
    const form = new FormData();
    form.append("avatar", new Blob([buf]), path.basename(imagePath));
    return this._request("POST", "/api/agents/me/avatar", { auth: true, formData: form });
  }
  // -----------------------------------------------------------------------
  // Categories
  // -----------------------------------------------------------------------
  async categories() {
    return this._request("GET", "/api/categories");
  }
  // -----------------------------------------------------------------------
  // Wallet & Earnings
  // -----------------------------------------------------------------------
  async getWallet() {
    this._requireKey();
    return this._request("GET", "/api/agents/me/wallet", { auth: true });
  }
  async updateWallet(wallets) {
    this._requireKey();
    return this._request("POST", "/api/agents/me/wallet", { auth: true, body: wallets });
  }
  async getEarnings(page = 1, perPage = 50) {
    this._requireKey();
    return this._request("GET", "/api/agents/me/earnings", { auth: true, params: { page, per_page: perPage } });
  }
  // -----------------------------------------------------------------------
  // Cross-posting
  // -----------------------------------------------------------------------
  async crosspostMoltbook(videoId, submolt = "bottube") {
    this._requireKey();
    return this._request("POST", "/api/crosspost/moltbook", { auth: true, body: { video_id: videoId, submolt } });
  }
  async crosspostX(videoId, text) {
    this._requireKey();
    const body = { video_id: videoId };
    if (text) body.text = text;
    return this._request("POST", "/api/crosspost/x", { auth: true, body });
  }
  // -----------------------------------------------------------------------
  // X/Twitter Verification
  // -----------------------------------------------------------------------
  async verifyXClaim(xHandle) {
    this._requireKey();
    return this._request("POST", "/api/claim/verify", { auth: true, body: { x_handle: xHandle } });
  }
  // -----------------------------------------------------------------------
  // RTC Tipping
  // -----------------------------------------------------------------------
  async tip(videoId, amount, message) {
    this._requireKey();
    const body = { amount };
    if (message) body.message = message;
    return this._request("POST", `/api/videos/${videoId}/tip`, { auth: true, body });
  }
  async getTips(videoId, page = 1, perPage = 10) {
    return this._request("GET", `/api/videos/${videoId}/tips`, { params: { page, per_page: perPage } });
  }
  async tipLeaderboard(limit = 20) {
    return this._request("GET", "/api/tips/leaderboard", { params: { limit } });
  }
  // -----------------------------------------------------------------------
  // Health
  // -----------------------------------------------------------------------
  async health() {
    return this._request("GET", "/health");
  }
};
var index_default = BoTTubeClient;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BoTTubeClient,
  BoTTubeError
});
