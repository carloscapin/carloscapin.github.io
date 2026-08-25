/**
 * Carlos portfolio media configuration.
 *
 * After deploying google-apps-script/Code.gs as a Web App, paste the `/exec`
 * URL into `mediaApiUrl`. This is the only repository value needed for the
 * Drive-powered gallery; future media changes happen inside Google Drive.
 */
window.CARLOS_PORTFOLIO_CONFIG = Object.freeze({
  driveRootFolderId: "1hnMwacczNwuYDOuuzSN_KQjQlFAQ1JtB",
  mediaApiUrl: "https://script.google.com/macros/s/AKfycbwH4w3oSUK4p_C-KGfhwM1ePEeqrfpIX77ejKvLpRd-7TfNzjJu0ySPUjADt_5ypjo/exec",
  refreshEveryMs: 5 * 60 * 1000,
  contactEmail: "",
});
