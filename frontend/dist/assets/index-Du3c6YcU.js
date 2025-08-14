var c=Object.defineProperty;var l=(a,t,e)=>t in a?c(a,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):a[t]=e;var n=(a,t,e)=>l(a,typeof t!="symbol"?t+"":t,e);(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))r(s);new MutationObserver(s=>{for(const o of s)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function e(s){const o={};return s.integrity&&(o.integrity=s.integrity),s.referrerPolicy&&(o.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?o.credentials="include":s.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(s){if(s.ep)return;s.ep=!0;const o=e(s);fetch(s.href,o)}})();class d{constructor(){n(this,"baseUrl");this.baseUrl="http://localhost:3001/api"}async getAllPosts(){try{const t=await fetch(`${this.baseUrl}/posts`);if(!t.ok)throw new Error(`HTTP error! status: ${t.status}`);return(await t.json()).posts||[]}catch(t){throw console.error("Error fetching posts:",t),t}}async getPostById(t){try{const e=await fetch(`${this.baseUrl}/posts/${t}`);if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);return(await e.json()).post}catch(e){throw console.error("Error fetching post:",e),e}}async createPost(t){try{const e=await fetch(`${this.baseUrl}/posts`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);return(await e.json()).post}catch(e){throw console.error("Error creating post:",e),e}}async checkHealth(){try{return(await fetch(`${this.baseUrl}/health`)).ok}catch(t){return console.error("Health check failed:",t),!1}}}class h{constructor(){n(this,"postsContainer");this.postsContainer=document.getElementById("posts-container")||document.body}renderPosts(t){if(t.length===0){this.renderEmptyState();return}const e=t.map(r=>this.renderPost(r)).join("");this.postsContainer.innerHTML=e}renderPost(t){const e=new Date(t.createdAt).toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"});return`
      <div class="card mb-4 shadow-sm post-card" data-post-id="${t.id}">
        <div class="card-body">
          <h5 class="card-title text-primary">${this.escapeHtml(t.title)}</h5>
          <p class="card-text">${this.escapeHtml(t.content)}</p>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
              <i class="bi bi-person-fill"></i> By ${this.escapeHtml(t.author)}
            </small>
            <small class="text-muted">
              <i class="bi bi-clock-fill"></i> ${e}
            </small>
          </div>
        </div>
      </div>
    `}renderEmptyState(){this.postsContainer.innerHTML=`
      <div class="text-center py-5">
        <div class="mb-4">
          <i class="bi bi-file-earmark-text display-1 text-muted"></i>
        </div>
        <h3 class="text-muted">No posts yet</h3>
        <p class="text-muted">Be the first to create a post!</p>
      </div>
    `}escapeHtml(t){const e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return t.replace(/[&<>"']/g,r=>e[r])}}class p{constructor(){n(this,"postService");n(this,"postRenderer");this.postService=new d,this.postRenderer=new h,this.init()}async init(){console.log("🚀 Athena App starting..."),await this.loadPosts(),this.setupEventListeners()}async loadPosts(){try{const t=await this.postService.getAllPosts();this.postRenderer.renderPosts(t)}catch(t){console.error("Failed to load posts:",t),this.showError("Failed to load posts. Please try again later.")}}setupEventListeners(){const t=document.getElementById("refresh-btn");t&&t.addEventListener("click",()=>this.loadPosts());const e=document.getElementById("create-post-form");e&&e.addEventListener("submit",async r=>{r.preventDefault(),await this.handleCreatePost(e)})}async handleCreatePost(t){const e=new FormData(t),r={title:e.get("title"),content:e.get("content"),author:e.get("author")};if(!r.title||!r.content||!r.author){this.showError("Please fill in all fields");return}try{await this.postService.createPost(r),t.reset(),await this.loadPosts(),this.showSuccess("Post created successfully!")}catch(s){console.error("Failed to create post:",s),this.showError("Failed to create post. Please try again.")}}showError(t){this.showAlert(t,"danger")}showSuccess(t){this.showAlert(t,"success")}showAlert(t,e){const r=document.getElementById("alert-container");if(!r)return;const s=document.createElement("div");s.className=`alert alert-${e} alert-dismissible fade show`,s.innerHTML=`
      ${t}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `,r.appendChild(s),setTimeout(()=>{s.parentNode&&s.parentNode.removeChild(s)},5e3)}}document.addEventListener("DOMContentLoaded",()=>{new p});
//# sourceMappingURL=index-Du3c6YcU.js.map
