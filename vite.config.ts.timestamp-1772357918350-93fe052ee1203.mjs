// vite.config.ts
import { defineConfig } from "file:///C:/Users/ppdub/Documents/Work/Weskill/Software/FastestCRM/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/ppdub/Documents/Work/Weskill/Software/FastestCRM/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/ppdub/Documents/Work/Weskill/Software/FastestCRM/node_modules/lovable-tagger/dist/index.js";
var __vite_injected_original_dirname = "C:\\Users\\ppdub\\Documents\\Work\\Weskill\\Software\\FastestCRM";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy all Supabase API calls through the dev server to avoid
      // direct outbound connection blocks (ISP/firewall blocking Supabase IP).
      // The client uses VITE_SUPABASE_URL directly in production (no proxy needed).
      "/supabase-proxy": {
        target: "https://api.fastestcrm.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path2) => path2.replace(/^\/supabase-proxy/, "")
      }
    }
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxwcGR1YlxcXFxEb2N1bWVudHNcXFxcV29ya1xcXFxXZXNraWxsXFxcXFNvZnR3YXJlXFxcXEZhc3Rlc3RDUk1cIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXHBwZHViXFxcXERvY3VtZW50c1xcXFxXb3JrXFxcXFdlc2tpbGxcXFxcU29mdHdhcmVcXFxcRmFzdGVzdENSTVxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvcHBkdWIvRG9jdW1lbnRzL1dvcmsvV2Vza2lsbC9Tb2Z0d2FyZS9GYXN0ZXN0Q1JNL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgaG9zdDogXCI6OlwiLFxyXG4gICAgcG9ydDogODA4MCxcclxuICAgIHByb3h5OiB7XHJcbiAgICAgIC8vIFByb3h5IGFsbCBTdXBhYmFzZSBBUEkgY2FsbHMgdGhyb3VnaCB0aGUgZGV2IHNlcnZlciB0byBhdm9pZFxyXG4gICAgICAvLyBkaXJlY3Qgb3V0Ym91bmQgY29ubmVjdGlvbiBibG9ja3MgKElTUC9maXJld2FsbCBibG9ja2luZyBTdXBhYmFzZSBJUCkuXHJcbiAgICAgIC8vIFRoZSBjbGllbnQgdXNlcyBWSVRFX1NVUEFCQVNFX1VSTCBkaXJlY3RseSBpbiBwcm9kdWN0aW9uIChubyBwcm94eSBuZWVkZWQpLlxyXG4gICAgICBcIi9zdXBhYmFzZS1wcm94eVwiOiB7XHJcbiAgICAgICAgdGFyZ2V0OiBcImh0dHBzOi8vYXBpLmZhc3Rlc3Rjcm0uY29tXCIsXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIHNlY3VyZTogdHJ1ZSxcclxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvc3VwYWJhc2UtcHJveHkvLCBcIlwiKSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbcmVhY3QoKSwgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpXS5maWx0ZXIoQm9vbGVhbiksXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbn0pKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE2VyxTQUFTLG9CQUFvQjtBQUMxWSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBSGhDLElBQU0sbUNBQW1DO0FBTXpDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBLE1BSUwsbUJBQW1CO0FBQUEsUUFDakIsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsU0FBUyxDQUFDQSxVQUFTQSxNQUFLLFFBQVEscUJBQXFCLEVBQUU7QUFBQSxNQUN6RDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTLENBQUMsTUFBTSxHQUFHLFNBQVMsaUJBQWlCLGdCQUFnQixDQUFDLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDOUUsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbInBhdGgiXQp9Cg==
