"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "pages/api/auth/login";
exports.ids = ["pages/api/auth/login"];
exports.modules = {

/***/ "(api)/./pages/api/auth/login.ts":
/*!*********************************!*\
  !*** ./pages/api/auth/login.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (/* binding */ handler)\n/* harmony export */ });\nasync function handler(req, res) {\n    if (req.method !== \"POST\") {\n        return res.status(405).json({\n            message: \"Method not allowed\"\n        });\n    }\n    try {\n        const { email , password  } = req.body;\n        if (!email || !password) {\n            return res.status(400).json({\n                message: \"Email and password are required\"\n            });\n        }\n        // TODO: Replace with actual backend API call\n        // For now, return a mock response\n        const mockResponse = {\n            token: \"mock-jwt-token-\" + Date.now(),\n            user: {\n                id: \"user-\" + Date.now(),\n                email: email,\n                full_name: \"Mock User\",\n                role: \"client\"\n            }\n        };\n        // Simulate API delay\n        await new Promise((resolve)=>setTimeout(resolve, 1000));\n        res.status(200).json(mockResponse);\n    } catch (error) {\n        console.error(\"Login error:\", error);\n        res.status(500).json({\n            message: \"Internal server error\"\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwaSkvLi9wYWdlcy9hcGkvYXV0aC9sb2dpbi50cy5qcyIsIm1hcHBpbmdzIjoiOzs7O0FBaUJlLGVBQWVBLFFBQzVCQyxHQUFtQixFQUNuQkMsR0FBeUQsRUFDekQ7SUFDQSxJQUFJRCxJQUFJRSxNQUFNLEtBQUssUUFBUTtRQUN6QixPQUFPRCxJQUFJRSxNQUFNLENBQUMsS0FBS0MsSUFBSSxDQUFDO1lBQUVDLFNBQVM7UUFBcUI7SUFDOUQsQ0FBQztJQUVELElBQUk7UUFDRixNQUFNLEVBQUVDLE1BQUssRUFBRUMsU0FBUSxFQUFFLEdBQWNQLElBQUlRLElBQUk7UUFFL0MsSUFBSSxDQUFDRixTQUFTLENBQUNDLFVBQVU7WUFDdkIsT0FBT04sSUFBSUUsTUFBTSxDQUFDLEtBQUtDLElBQUksQ0FBQztnQkFBRUMsU0FBUztZQUFrQztRQUMzRSxDQUFDO1FBRUQsNkNBQTZDO1FBQzdDLGtDQUFrQztRQUNsQyxNQUFNSSxlQUE4QjtZQUNsQ0MsT0FBTyxvQkFBb0JDLEtBQUtDLEdBQUc7WUFDbkNDLE1BQU07Z0JBQ0pDLElBQUksVUFBVUgsS0FBS0MsR0FBRztnQkFDdEJOLE9BQU9BO2dCQUNQUyxXQUFXO2dCQUNYQyxNQUFNO1lBQ1I7UUFDRjtRQUVBLHFCQUFxQjtRQUNyQixNQUFNLElBQUlDLFFBQVFDLENBQUFBLFVBQVdDLFdBQVdELFNBQVM7UUFFakRqQixJQUFJRSxNQUFNLENBQUMsS0FBS0MsSUFBSSxDQUFDSztJQUN2QixFQUFFLE9BQU9XLE9BQU87UUFDZEMsUUFBUUQsS0FBSyxDQUFDLGdCQUFnQkE7UUFDOUJuQixJQUFJRSxNQUFNLENBQUMsS0FBS0MsSUFBSSxDQUFDO1lBQUVDLFNBQVM7UUFBd0I7SUFDMUQ7QUFDRixDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vbWFya2V0cGxhY2UtZnJvbnRlbmQvLi9wYWdlcy9hcGkvYXV0aC9sb2dpbi50cz83NDRkIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB0eXBlIHsgTmV4dEFwaVJlcXVlc3QsIE5leHRBcGlSZXNwb25zZSB9IGZyb20gJ25leHQnXHJcblxyXG50eXBlIExvZ2luRGF0YSA9IHtcclxuICBlbWFpbDogc3RyaW5nXHJcbiAgcGFzc3dvcmQ6IHN0cmluZ1xyXG59XHJcblxyXG50eXBlIExvZ2luUmVzcG9uc2UgPSB7XHJcbiAgdG9rZW46IHN0cmluZ1xyXG4gIHVzZXI6IHtcclxuICAgIGlkOiBzdHJpbmdcclxuICAgIGVtYWlsOiBzdHJpbmdcclxuICAgIGZ1bGxfbmFtZTogc3RyaW5nXHJcbiAgICByb2xlOiBzdHJpbmdcclxuICB9XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIoXHJcbiAgcmVxOiBOZXh0QXBpUmVxdWVzdCxcclxuICByZXM6IE5leHRBcGlSZXNwb25zZTxMb2dpblJlc3BvbnNlIHwgeyBtZXNzYWdlOiBzdHJpbmcgfT5cclxuKSB7XHJcbiAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoNDA1KS5qc29uKHsgbWVzc2FnZTogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSlcclxuICB9XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCB7IGVtYWlsLCBwYXNzd29yZCB9OiBMb2dpbkRhdGEgPSByZXEuYm9keVxyXG5cclxuICAgIGlmICghZW1haWwgfHwgIXBhc3N3b3JkKSB7XHJcbiAgICAgIHJldHVybiByZXMuc3RhdHVzKDQwMCkuanNvbih7IG1lc3NhZ2U6ICdFbWFpbCBhbmQgcGFzc3dvcmQgYXJlIHJlcXVpcmVkJyB9KVxyXG4gICAgfVxyXG5cclxuICAgIC8vIFRPRE86IFJlcGxhY2Ugd2l0aCBhY3R1YWwgYmFja2VuZCBBUEkgY2FsbFxyXG4gICAgLy8gRm9yIG5vdywgcmV0dXJuIGEgbW9jayByZXNwb25zZVxyXG4gICAgY29uc3QgbW9ja1Jlc3BvbnNlOiBMb2dpblJlc3BvbnNlID0ge1xyXG4gICAgICB0b2tlbjogJ21vY2stand0LXRva2VuLScgKyBEYXRlLm5vdygpLFxyXG4gICAgICB1c2VyOiB7XHJcbiAgICAgICAgaWQ6ICd1c2VyLScgKyBEYXRlLm5vdygpLFxyXG4gICAgICAgIGVtYWlsOiBlbWFpbCxcclxuICAgICAgICBmdWxsX25hbWU6ICdNb2NrIFVzZXInLFxyXG4gICAgICAgIHJvbGU6ICdjbGllbnQnXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBTaW11bGF0ZSBBUEkgZGVsYXlcclxuICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCAxMDAwKSlcclxuXHJcbiAgICByZXMuc3RhdHVzKDIwMCkuanNvbihtb2NrUmVzcG9uc2UpXHJcbiAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0xvZ2luIGVycm9yOicsIGVycm9yKVxyXG4gICAgcmVzLnN0YXR1cyg1MDApLmpzb24oeyBtZXNzYWdlOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9KVxyXG4gIH1cclxufVxyXG4iXSwibmFtZXMiOlsiaGFuZGxlciIsInJlcSIsInJlcyIsIm1ldGhvZCIsInN0YXR1cyIsImpzb24iLCJtZXNzYWdlIiwiZW1haWwiLCJwYXNzd29yZCIsImJvZHkiLCJtb2NrUmVzcG9uc2UiLCJ0b2tlbiIsIkRhdGUiLCJub3ciLCJ1c2VyIiwiaWQiLCJmdWxsX25hbWUiLCJyb2xlIiwiUHJvbWlzZSIsInJlc29sdmUiLCJzZXRUaW1lb3V0IiwiZXJyb3IiLCJjb25zb2xlIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(api)/./pages/api/auth/login.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-api-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(api)/./pages/api/auth/login.ts"));
module.exports = __webpack_exports__;

})();