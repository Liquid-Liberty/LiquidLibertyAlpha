// vite.config.js
import { defineConfig } from "file:///E:/Liquid%20Liberty/alpha/LiquidLibertyMarket/node_modules/vite/dist/node/index.js";
import react from "file:///E:/Liquid%20Liberty/alpha/LiquidLibertyMarket/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Any request from our app starting with /geckoapi will be forwarded
      "/geckoapi": {
        target: "https://api.coingecko.com/api",
        // Target now includes /api
        changeOrigin: true,
        // This is essential
        // This now correctly removes our proxy-specific path
        rewrite: (path) => path.replace(/^\/geckoapi/, "")
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJFOlxcXFxMaXF1aWQgTGliZXJ0eVxcXFxhbHBoYVxcXFxMaXF1aWRMaWJlcnR5TWFya2V0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJFOlxcXFxMaXF1aWQgTGliZXJ0eVxcXFxhbHBoYVxcXFxMaXF1aWRMaWJlcnR5TWFya2V0XFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9FOi9MaXF1aWQlMjBMaWJlcnR5L2FscGhhL0xpcXVpZExpYmVydHlNYXJrZXQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcclxuICBzZXJ2ZXI6IHtcclxuICAgIHByb3h5OiB7XHJcbiAgICAgIC8vIEFueSByZXF1ZXN0IGZyb20gb3VyIGFwcCBzdGFydGluZyB3aXRoIC9nZWNrb2FwaSB3aWxsIGJlIGZvcndhcmRlZFxyXG4gICAgICAnL2dlY2tvYXBpJzoge1xyXG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vYXBpLmNvaW5nZWNrby5jb20vYXBpJywgLy8gVGFyZ2V0IG5vdyBpbmNsdWRlcyAvYXBpXHJcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLCAvLyBUaGlzIGlzIGVzc2VudGlhbFxyXG4gICAgICAgIC8vIFRoaXMgbm93IGNvcnJlY3RseSByZW1vdmVzIG91ciBwcm94eS1zcGVjaWZpYyBwYXRoXHJcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2dlY2tvYXBpLywgJycpLCBcclxuICAgICAgfSxcclxuICAgIH1cclxuICB9XHJcbn0pXHJcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBNlQsU0FBUyxvQkFBb0I7QUFDMVYsT0FBTyxXQUFXO0FBR2xCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDTixPQUFPO0FBQUE7QUFBQSxNQUVMLGFBQWE7QUFBQSxRQUNYLFFBQVE7QUFBQTtBQUFBLFFBQ1IsY0FBYztBQUFBO0FBQUE7QUFBQSxRQUVkLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxlQUFlLEVBQUU7QUFBQSxNQUNuRDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
