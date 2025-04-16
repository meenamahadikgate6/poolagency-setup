"use strict";
/* Application v1.0.1 */
/*
 * Angular js Application starts here
 * Contains view binding and
 * angular configration function
 */
// create the module and name it poolagency
angular
  .module("POOLAGENCY", [
    "validator",
    "ui.carousel",
    "ui.router",
    "ngAuth",
    "ngIdle",
    "ngApiGateWay",
    "ngCookies",
    "naif.base64",
    "angular-click-outside",
    "bw.paging",
    "ngDialog",
    "ng.deviceDetector",
    "angular-google-analytics",
    "ngImgCrop",
    "uiCropper",
    "autoCompleteModule",
    "ae-datetimepicker",
    "ngIntercom",
    "colorpicker.module",
    "ui.tree",
    "tooltips",
    "uiRouterStyles",
    "tree.dropdown",
    "froala"
  ])
  // configure application routes
  .config(function(
    $stateProvider,
    $urlRouterProvider,
    $locationProvider,
    authProvider,
    apiGateWayProvider,
    AnalyticsProvider,
    IdleProvider,
    KeepaliveProvider,
    configConstant,
    $qProvider
  ) {   
    $qProvider.errorOnUnhandledRejections(false) 
    // Add configuration code as desired
    KeepaliveProvider.interval(10);
    IdleProvider.windowInterrupt("focus");
    var currEnvironment = configConstant.currEnvironment;
    let webVersion = configConstant[currEnvironment].webVersion;
    AnalyticsProvider.setAccount({
      tracker: configConstant[currEnvironment].googleAnalyticKey,
      name: "tracker1",
      trackEvent: true,
      displayFeatures: true,
      enhancedLinkAttribution: true
    });
    //UU-XXXXXXX-X should be your tracking code
    // Track all routes (default is true).
    AnalyticsProvider.trackPages(true);
    // Track all URL query params (default is false).
    AnalyticsProvider.trackUrlParams(true);
    // Ignore first page view (default is false).
    // Helpful when using hashes and whenever your bounce rate looks obscenely low.
    // AnalyticsProvider.ignoreFirstPageLoad(true);
    // URL prefix (default is empty).
    // Helpful when the app doesn't run in the root directory.
    AnalyticsProvider.trackPrefix("poolagency");
    // Change the default page event name.
    // Helpful when using ui-router, which fires $stateChangeSuccess instead of $routeChangeSuccess.
    AnalyticsProvider.setPageEvent("$stateChangeStart");
    // RegEx to scrub location before sending to analytics.
    // Internally replaces all matching segments with an empty string.
    AnalyticsProvider.setRemoveRegExp(/\/\d+?$/);
    // Activate reading custom tracking urls from $routeProvider config (default is false)
    // This is more flexible than using RegExp and easier to maintain for multiple parameters.
    // It also reduces tracked pages to routes (only those with a templateUrl) defined in the
    // $routeProvider and therefore reduces bounce rate created by redirects.
    // NOTE: The following option requires the ngRoute module
    // AnalyticsProvider.readFromRoute(true);
    // $urlRouterProvider.otherwise("/login");
    $stateProvider

      /*********************************Start Poolagency super admin routing***************************************/
      // ROUTING TO DISPLAY SUPER ADMIN LOGIN PAGE
      .state("pladminlogin", {
        url: "/pb-superadmin",
        canActiveFor: [],
        authRequired: false,
        title: "Alerts",
        templateUrl: "templates/administrator/login.html?ver="+webVersion,
        controller: "plAdminAuthController"
      })

      // NESTED VIEWS TO MANAGE TEMPLATE HEADER AND LEFTBAR
      .state("administrator", {
        url: "/administrator",
        canActiveFor: [],
        authRequired: false,
        views: {
          "": {
            templateUrl:"templates/administrator/layout/header.html?ver="+webVersion,
            controller: "headerController"
          },
          "leftView@administrator": {
            templateUrl:"templates/administrator/layout/leftbar.html?ver="+webVersion,
            controller: "leftBarController"
          }
        }
      })

      .state("tech_rating", {
        url: "/tech_rating",
        canActiveFor: [],
        authRequired: false,
        templateUrl: "templates/reviewmodal.html?ver="+webVersion,
        controller: "techRatingController"
      })

      .state("unsubscribeEmails", {
        url: "/unsubscribe/:uid",
        canActiveFor: [],
        authRequired: false,
        templateUrl: "templates/unsubscribeEmails.html?ver="+webVersion,
        controller: "unsubscribeEmailsController"
      })

      .state("analyticsDashboard", {
        url: "/analytics",
        canActiveFor: [],
        authRequired: false,
        templateUrl: "templates/analyticsDashboard.html?ver="+webVersion,
        controller: "analyticsDashboardController"
      })
      //ROUTING TO DISPLAY ADMINISTRATOR DASHBOARD
      .state("administrator.dashboard", {
        url: "/dashboard",
        authRequired: true,
        canActiveFor: ["administrator"],
        title: "Alerts",
        views: {
          "app-view": {
            templateUrl: "templates/administrator/dashboard.html?ver="+webVersion,
            controller: "adminDashboardController"
          }
        }
      })

      //ROUTING TO DISPLAY ADMINISTRATOR COMPANY LIST
      .state("administrator.company", {
        url: "/company",
        authRequired: true,
        canActiveFor: ["administrator"],
        title: "Companies",
        views: {
          "app-view": {
            templateUrl: "templates/administrator/company.html?ver="+webVersion,
            controller: "companyManageController"
          }
        }
      })
      //ROUTING TO DISPLAY Code Management LIST
      /*
      .state("administrator.codemanagement", {
        url: "/codemanagement",
        authRequired: true,
        canActiveFor: ["administrator"],
        title: "Code Management",
        views: {
          "app-view": {
            templateUrl:"templates/administrator/code-management.html?ver="+webVersion,
            controller: "codeManagementController"
          }
        }
      })
      */

      //ROUTING TO DISPLAY ADMINISTRATOR COMPANY DETAILS
      .state("administrator.company-details", {
        url: "/company-details/:companyId",
        authRequired: true,
        canActiveFor: ["administrator"],
        title: "Company",
        views: {
          "app-view": {
            templateUrl:"templates/administrator/company-details.html?ver="+webVersion,
            controller: "companyDetailsController"
          }
        }
      })
      //ROUTING TO DISPLAY ADMINISTRATOR DEVICES
      /*
      .state("administrator.device", {
        url: "/device",
        authRequired: true,
        canActiveFor: ["administrator"],
        title: "Device",
        views: {
          "app-view": {
            templateUrl: "templates/administrator/device.html?ver="+webVersion,
            controller: "deviceController"
          }
        }
      })
      */

      //ROUTING TO DISPLAY ADMINISTRATOR SETTINGS
      .state("administrator.settings", {
        url: "/settings",
        authRequired: true,
        canActiveFor: ["administrator"],
        title: "Settings",
        views: {
          "app-view": {
            templateUrl: "templates/administrator/settings.html?ver="+webVersion,
            controller: "adminSettingsController"
          }
        }
      })

      //ROUTING TO DISPLAY ADMINISTRATOR CONTACT/ISSUE
      .state("administrator.contactissue", {
        url: "/admincontactissue",
        canActiveFor: ["administrator"],
        authRequired: true,
        title: "Contact Issue",
        views: {
          "app-view": {
            templateUrl: "templates/contactissue.html?ver="+webVersion,
            controller: "contactissueController"
          }
        }
      })

      /**********************************End Poolagency super admin routing**************************************/
      // USING FOR QUICKBOOK AUTH INTEGRATION
      .state("quickbook-auth", {
        url: "/quickbook-auth",
        authRequired: true,
        canActiveFor: ["companyadmin", "companymanager", "servicemanager"],
        title: "QuickBook",
        controller: "quickbookController"
      })

      // NESTED VIEWS TO MANAGE TEMPLATE HEADER AND LEFTBAR
      .state("app", {
        url: "/app",
        authRequired: true,
        canActiveFor: [],
        views: {
          "": {
            templateUrl: "templates/layout/header.html?ver="+webVersion,
            controller: "headerController"
          },
          "leftBarView@app": {
            templateUrl: "templates/layout/leftbar.html?ver="+webVersion,
            controller: "leftBarController"
          }
        }
      })
      // ROUTING TO DISPLAY LOGIN PAGE
      .state("login", {
        url: "/login",
        canActiveFor: [],
        authRequired: false,
        title: "Alerts",
        templateUrl: "templates/login.html?ver="+webVersion,
        controller: "authLoginController"
      })
      .state("forgot-password", {
        url: "/forgot-password",
        canActiveFor: [],
        authRequired: false,
        title: "Alerts",
        templateUrl: "templates/forgot-password.html?ver="+webVersion,
        controller: "authLoginController"
      })
      .state("reset-password", {
        url: "/reset-password",
        canActiveFor: [],
        authRequired: false,
        title: "Reset Password",
        templateUrl: "templates/reset-password.html?ver="+webVersion,
        controller: "resetPasswordController"
      })
      .state("user-signup", {
        url: "/user-signup",
        canActiveFor: [],
        authRequired: false,
        title: "Signup",
        templateUrl: "templates/tokenSignup.html?ver="+webVersion,
        controller: "tokenSignupController"
      })
      // ROUTING TO DISPLAY SIGNUP PAGE
      .state("signup", {
        url: "/signup",
        params: {
          signUpPageData: {
            isLoadedFromSignupLink: false
          }
        },
        canActiveFor: [],
        authRequired: false,
        templateUrl: "templates/signup.html?ver="+webVersion,
        controller: "authController"
      })
      // ROUTING TO DISPLAY SIGNUP PAGE
      .state("app.companysignup", {
        url: "/companysignup",
        canActiveFor: ["user", "companyadmin"],
        authRequired: true,
        views: {
          "app-view": {
            templateUrl: "templates/company/companysignup.html?ver="+webVersion,
            controller: "companySignupController"
          }
        }
      })
      // ROUTING TO DISPLAY DASHBOARD PAGE IN app-view STATE
      .state("app.dashboard", {
        url: "/dashboard",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        title: "Alerts",
        authRequired: true,
        views: {
          "app-view": {
            templateUrl: "templates/dashboard.html?ver="+webVersion,
            controller: "dashboardController"
          }
        }
      })
      // ROUTING TO DISPLAY DASHBOARD PAGE IN app-view STATE
      .state("app.cdashboard", {
        url: "/cdashboard",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "viewer",
          "user"
        ],
        title: "",
        authRequired: true,
        views: {
          "app-view": {
            templateUrl: "templates/cdashboard.html?ver="+webVersion
            //controller: "cdashboardController"
          }
        }
      })
      // ROUTING TO DISPLAY DASHBOARD PAGE IN app-view STATE
      .state("app.companysettings", {
        url: "/company-settings",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "viewer"
        ],
        title: "Settings",
        authRequired: true,
        views: {
          "app-view": {
            templateUrl: "templates/company/settings.html?ver="+webVersion,
            controller: "companySettingsController"
          }
        }
      })
      // ROUTING TO DISPLAY ALERTS MANAGEMENT PAGE IN app-view STATE
      .state("app.alertsmanagement", {
        url: "/alerts-management",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        title: "Customize Alerts",
        authRequired: true,
        views: {
          "app-view": {
            templateUrl: "templates/company/alertsmanagement.html?ver="+webVersion,
            controller: "alertsManagementController"
          }
        }
      })
      // ROUTING TO DISPLAY ALERT POP OUT PAGE IN app-view STATE
      .state("alertpopout", {
        url: "/alert-popout/:jobDetailId",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        templateUrl: "templates/alert-popout.html?ver="+webVersion,
        controller: "dashboardController"
      })
      // ROUTING TO DISPLAY CUSTOMER BOARD PAGE IN app-view STATE
      .state("app.customer", {
        url: "/customer",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Customers",
        views: {
          "app-view": {
            templateUrl: "templates/customer.html?ver="+webVersion,
            controller: "customerController"
          }
        }
      })
      // ROUTING TO DISPLAY CUSTOMER BOARD PAGE IN app-view STATE (Multi-Access with companyId)
      .state("app.companycustomer", {
        url: "/customer/:companyId",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Customers",
        views: {
          "app-view": {
            templateUrl: "templates/customer.html?ver="+webVersion,
            controller: "customerController"
          }
        }
      })
      // ROUTING TO DISPLAY CUSTOMER DETAIL PAGE IN app-view STATE
      .state("app.customerdetail", {
        url: "/customerdetail/:addressId",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Customer",
        views: {
          "app-view": {
            templateUrl: "templates/customerdetail.html?ver="+webVersion,
            controller: "customerDetailController"
          }
        }
      })
      // ROUTING TO DISPLAY location detail PAGE IN app-view STATE
      .state("app.locationdetail", {
        url: "/locationdetail/:addressId",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Location",
        views: {
          "app-view": {
            templateUrl: "templates/locationdetail.html?ver="+webVersion,
            controller: "locationDetailController"
          }
        }
      })
      // ROUTING TO DISPLAY CUSTOMER JOB DETAIL PAGE IN app-view STATE
      .state("app.customerjobdetail", {
        url: "/customerjobdetail/:addressId/:jobId",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Customers - ",
        views: {
          "app-view": {
            templateUrl: "templates/customerjobdetail.html?ver="+webVersion,
            controller: "customerJobDetailController"
          }
        }
      })
      .state("app.customerwaterbodydetail", {
        url: "/customerjobdetail/:addressId/:jobId/:waterBodyId",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Customers - ",
        views: {
          "app-view": {
            templateUrl: "templates/customerjobdetail.html?ver="+webVersion,
            controller: "customerJobDetailController"
          }
        }
      })
      .state("app.remotedatamonitoring", {
        url: "/remotedata/:addressId/:dataId/:deviceWaterBodyId",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Remote Data Received",
        views: {
          "app-view": {
            templateUrl: "templates/remotedatadetail.html?ver="+webVersion,
            controller: "remoteDataDetailController"
          }
        }
      })
      .state("app.dnsInsturctions", {
        url: "/dns_instructions",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "",
        views: {
          "app-view": {
            templateUrl: "templates/dns_instructions.html?ver="+webVersion,            
          }
        }
      })


      // ROUTING TO DISPLAY CUSTOMER JOB IMAGES PAGE IN app-view STATE
      .state("app.customerjobimages", {
        url: "/customerjobimages/:jobId",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Job Images",
        views: {
          "app-view": {
            templateUrl: "templates/customerjobimages.html?ver="+webVersion,
            controller: "customerJobImagesController"
          }
        }
      })
      // ROUTING TO DISPLAY LOGIN USER PROFILE PAGE IN app-view STATE
      .state("app.profile", {
        url: "/profile",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "viewer"
        ],
        authRequired: true,
        title: "Profile",
        views: {
          "app-view": {
            templateUrl: "templates/managers.html?ver="+webVersion,
            controller: "managerController"
          }
        }
      })
      .state("app.installdetail", {
        url: "/installdetail/:addressId",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Installation - ",
        views: {
          "app-view": {
            templateUrl: "templates/installdetail.html?ver="+webVersion,
            controller: "installDetailController"
          }
        }
      })
      // ROUTING TO DISPLAY TECHINCIANS PAGE IN app-view STATE
      .state("app.usermanagement", {
        url: "/usermanagement",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "User Management",
        views: {
          "app-view": {
            templateUrl: "templates/company/usermanagement.html?ver="+webVersion,
            controller: "userManageController"
          }
        }
      })
      .state("app.technicians", {
        url: "/technicians",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Technicians",
        views: {
          "app-view": {
            templateUrl: "templates/technician.html?ver="+webVersion,
            controller: "technicianController"
          }
        }
      })
      //ROUTING TO DISPLAY CONTACT ISSUES PAGE IN app-view STATE
      .state("app.contactissue", {
        url: "/contactissue",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "viewer"
        ],
        authRequired: true,
        title: "Contact Issue",
        views: {
          "app-view": {
            templateUrl: "templates/contactissue.html?ver="+webVersion,
            controller: "contactissueController"
          }
        }
      })

      //ROUTING TO DISPLAY TECHNICIAN DETAIL PAGE IN app-view STATE
      .state("app.techniciandetail", {
        url: "/techniciandetail/:technicianId",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Technicians",
        views: {
          "app-view": {
            templateUrl: "templates/techniciandetail.html?ver="+webVersion,
            controller: "technicianDetailController"
          }
        }
      })
      //ROUTING TO DISPLAY SETTING PAGE IN app-view STATE
      .state("app.settings", {
        url: "/settings",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "viewer"
        ],
        authRequired: true,
        title: "Settings",
        views: {
          "app-view": {
            templateUrl: "templates/setting.html?ver="+webVersion,
            controller: "settingsController"
          }
        }
      })
      //ROUTING TO DISPLAY REPORTS PAGE IN app-view STATE
      .state("app.reports", {
        url: "/reports",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",          
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Reports",
        views: {
          "app-view": {
            templateUrl: "templates/company/reports.html?ver="+webVersion,
            controller: "reportsController"
          }
        }    
      }) 
      //ROUTING TO DISPLAY EMAIL CENTER PAGE IN app-view STATE
      .state("app.emailcenter", {
        url: "/email-center",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",          
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Email Center",
        views: {
          "app-view": {
            templateUrl: "templates/email-center/email-center.html?ver="+webVersion, 
            controller: "emailCenterController"           
          }
        }    
      }) 
      //ROUTING TO DISPLAY TECHNICIAN ROUTE PAGE IN app-view STATE
      .state("technicianroute", {
        url: "/technicianroute",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",          
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Technician Route",
        templateUrl: "templates/technician-route/technicianroute.html?ver="+webVersion,
        controller: "technicianRouteController"        
      })
      .state("app.customerinvoicedetail", {
        url: "/customerinvoicedetail/:invoiceId",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "INVOICE  ",
        views: {
          "app-view": {
            templateUrl: "templates/customerinvoicedetail.html?ver="+webVersion,
            controller: "customerInvoiceDetailController"         
          }
        },    
        data: {
          css: '/resources/styles/invoices.css?ver='+webVersion
        }       
      })
      .state("app.customerquotesdetail", {
        url: "/customerquotesdetail/:quoteId",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "QUOTE  ",
        views: {
          "app-view": {
            templateUrl: "templates/customerquotesdetail.html?ver="+webVersion,
            controller: "customerQuotesDetailController"         
          }
        },    
        data: {
          css: '/resources/styles/invoices.css?ver='+webVersion
        }       
      })
      .state("invoice", {
        url: "/invoice/:companyId/:invoiceId",
        canActiveFor: [],
        authRequired: false,
        visibleAfterLogin:true,        
        title: "INVOICE ",
        templateUrl: "templates/customerinvoicedetailnoauth.html?ver="+webVersion,
        controller: "customerInvoiceDetailController",
        data: {
          css: '/resources/styles/invoices.css?ver='+webVersion
        }   
      })
      .state("invoiceWithKey", {
        url: "/invoice?q",
        canActiveFor: [],
        authRequired: false,
        visibleAfterLogin:true,        
        title: "INVOICE ",
        templateUrl: "templates/customerinvoicedetailnoauth.html?ver="+webVersion,
        controller: "customerInvoiceDetailController",
        data: {
          css: '/resources/styles/invoices.css?ver='+webVersion
        }   
      })
      .state("quotes", {
        url: "/quotes/:companyId/:quoteId",
        canActiveFor: [],
        authRequired: false,
        visibleAfterLogin:true,        
        title: "QUOTE ",
        templateUrl: "templates/customerquotedetailnoauth.html?ver="+webVersion,
        controller: "customerQuotesDetailController",
        data: {
          css: '/resources/styles/invoices.css?ver='+webVersion
        }   
      })
      .state("quotesWithKey", {
        url: "/quotes?q",
        canActiveFor: [],
        authRequired: false,
        visibleAfterLogin:true,        
        title: "QUOTE ",
        templateUrl: "templates/customerquotedetailnoauth.html?ver="+webVersion,
        controller: "customerQuotesDetailController",
        data: {
          css: '/resources/styles/invoices.css?ver='+webVersion
        }   
      })
       // ROUTING TO DISPLAY CUSTOMER BOARD PAGE IN app-view STATE
       .state("app.products", {
        url: "/products",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Products & Services",
        views: {
          "app-view": {
            templateUrl: "templates/products-services/productsnservices.html?ver="+webVersion,
            controller: "productsnservicesController"
          }
        }
      })
      .state("app.trucks", {
        url: "/trucks",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Trucks & Tools",
        views: {
          "app-view": {
            templateUrl: "templates/trucksntools.html?ver="+webVersion,
            controller: "trucksController"
          }
        }
      })
      .state("app.inventory", {
        url: "/inventory",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Inventory",
        views: {
          "app-view": {
            templateUrl: "templates/inventory/inventoryHome.html?ver="+webVersion,
            controller: "inventoryController"
          }
        }
      })
      .state("app.onetimejob", {
        url: "/one-time-job/:addressId/:jobId",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "One time Job",
        views: {
          "app-view": {
            templateUrl: "templates/one-time-job/one-time-job.html?ver="+webVersion,
            controller: "oneTimeJobOverviewController"
          }
        }
      })

      .state("app.onetimejoblist", {
        url: "/one-time-job-list",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Job Statuses",
        views: {
          "app-view": {
            templateUrl: "templates/one-time-job/one-time-job-list.html?ver="+webVersion,
            controller: "oneTimeJobListController"
          }
        }
      })

      .state("app.quotelistingSingle", {
        url: "/quote-list",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Quotes",
        views: {
          "app-view": {
            templateUrl: "templates/quote-list.html?ver="+webVersion,
            controller: "customerQuotesListController"
          }
        }
      })
      .state("app.invoicelistingSingle", {
        url: "/invoice-list",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Invoices",
        views: {
          "app-view": {
            templateUrl: "templates/invoice-list.html?ver="+webVersion,
            controller: "customerInvoiceListController"
          }
        },    
        data: {
          css: '/resources/styles/invoices.css?ver='+webVersion
        } 
      })

      .state("app.paymentlistingSingle", {
        url: "/payment-list",
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Payments",
        views: {
          "app-view": {
            templateUrl: "templates/payment-list.html?ver="+webVersion,
            controller: "customerPaymentListController"
          }
        }
      })
      .state("app.logout", {
        url: "/logout",        
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "administrator",
          "viewer"
        ],
        authRequired: true,
        title: "Logout",
        views: {
          "app-view": {
            templateUrl: "templates/logout.html?ver="+webVersion,
            controller: "logoutController"
          }
        }
      })
      //ROUTING TO DISPLAY COMPANY DEVICES DASHBOARD
      /*.state("app.devices", {
        url: "/devices",
        authRequired: true,
        canActiveFor: [
          "companyadmin",
          "companymanager",
          "servicemanager",
          "viewer"
        ],
        title: "Device",
        views: {
          "app-view": {
            templateUrl: "templates/administrator/device.html?ver="+webVersion,
            controller: "deviceController"
          }
        }
      })*/
      ;

    $locationProvider.html5Mode(true);
    //to set login url
    var authDataObj = {      
      authUrl: configConstant[currEnvironment].server + "/login",
      adminAuthUrl: configConstant[currEnvironment].server + "/administrator/login",      
      headers: {
        "X-API-KEY": configConstant[currEnvironment].xApiKey
      }
    };
    //var authDataObj = {authUrl : 'http://localhost:5000/login'};
    authProvider.setAuthData(authDataObj);
  })

  .config(function($validatorProvider) {
    $validatorProvider.register("required", {
      invoke: "submit",
      validator: /^.+$/,
      error: "This field is required."
    });

    $validatorProvider.register("positive", {
      invoke: "submit",
      validator: /^[1-9][0-9]*$/,
      error: "This field is required."
    });

    $validatorProvider.register("textarea", {
      invoke: "submit",
      validator: /.*\S.*/,
      error: "This field is required."
    });

    $validatorProvider.register("email", {
      invoke: "submit",
      validator: /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
      error: "Enter valid email."
    });
    $validatorProvider.register("alphanum", {
      invoke: "submit",
      validator: /^\w+( +\w+)*$/,
      error: "Enter only alpha numeric characters."
    });
    $validatorProvider.register("companyName", {
      invoke: "submit",
      validator: /^[A-Za-z0-9 &'.()-]*$/,
      error: "Enter a valid company name."
    });
    $validatorProvider.register("alpha", {
      invoke: "submit",
      validator: /^[A-z]+$/,
      error: "Enter valid alphabetical characters."
    });
    $validatorProvider.register("alphaLower", {
      invoke: "submit",
      validator: /^[a-z0-9]+$/,
      error: "Enter only alpha numeric characters."
    });
    $validatorProvider.register("alphaspace", {
      invoke: "submit",
      validator: /^[A-z ]+$/,
      error: "Enter valid alphabetical characters."
    });
    $validatorProvider.register("month", {
      invoke: "submit",
      validator: /^(0?[1-9]|1[012])$/,
      error: "Enter valid month."
    });
    $validatorProvider.register("year", {
      invoke: "submit",
      validator: /(?:(?:20)[0-9]{2})/,
      error: "Enter valid year."
    });
    $validatorProvider.register("numeric", {
      invoke: "submit",
      validator: /(^[0-9]+$|^$)/,
      error: "Enter valid number."
    });

    $validatorProvider.register("phone", {
      invoke: "submit",
      //validator: /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[789]\d{9}$/,
      validator: /^\d{10}$/,
      error: "Enter valid phone number."
    });

    $validatorProvider.register("date", {
      invoke: "submit",
      validator: /^(0[1-9]|1[0-2])\/(0[1-9]|1\d|2\d|3[01])\/(19|20)\d{2}$/,
      error: "Enter valid date."
    });
    $validatorProvider.register("float", {
      invoke: "submit",
      validator: /^[0-9]{1,11}(?:\.[0-9]{1,3})?$|^$/,
      error: "Enter valid number(3 digit after decimal allowed)."
    });
    $validatorProvider.register("url", {
      invoke: "submit",
      validator: /^(www\.|http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/,
      error: "Please enter a valid url"
    });

    $validatorProvider.register("password", {
      invoke: "submit",
      validator: /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/,
      error:
        "Please enter a valid password, 8 Chars. min with 1 capital, 1 lower and 1 numeric"
    });

    $validatorProvider.register("creditcard", {
      invoke: "submit",
      validator: /^(?:(4[0-9]{12}(?:[0-9]{3})?)|(5[1-5][0-9]{14})|(6(?:011|5[0-9]{2})[0-9]{12})|(3[47][0-9]{13})|(3(?:0[0-5]|[68][0-9])[0-9]{11})|((?:2131|1800|35[0-9]{3})[0-9]{11}))$/,
      error: "Please enter a valid Credit Card Number"
    });
  })

  .run(function(
    $rootScope,
    companyService,
    $state,
    $stateParams,
    auth,
    config,
    apiGateWay,
    $window,
    $location,
    Analytics,
    Idle,
    $filter,
    ngDialog,
    pendingRequests,
    $intercom,    
    configConstant,
    AwsConfigService,
  ) {
    $rootScope.isIntercomBlockedState = function(){
      const blockedStates = [
          {
              stateName: 'tech_rating',
              urlPattern: /^\/tech_rating$/, // Matches "/tech_rating"
              params: [] // No params for this state
          },
          {
              stateName: 'unsubscribeEmails',
              urlPattern: /^\/unsubscribe\/[^\/]+$/, // Matches "/unsubscribe/:uid"
              params: ['uid'] // Only 'uid' is a parameter
          },
          {
              stateName: 'invoice',
              urlPattern: /^\/invoice\/[^\/]+\/[^\/]+$/, // Matches "/invoice/:companyId/:invoiceId"
              params: ['companyId', 'invoiceId'] // companyId and invoiceId are params
          },
          {
              stateName: 'quotes',
              urlPattern: /^\/quotes\/[^\/]+\/[^\/]+$/, // Matches "/quotes/:companyId/:quoteId"
              params: ['companyId', 'quoteId'] // companyId and quoteId are params
          },
          {
              stateName: 'invoiceWithKey',
              urlPattern: /^\/invoice\?q=[^\/]+$/, // Matches "/invoice?q"
              params: ['q'] // 'q' is a parameter
          },
          {
              stateName: 'quotesWithKey',
              urlPattern: /^\/quotes\?q=[^\/]+$/, // Matches "/quotes?q"
              params: ['q'] // 'q' is a parameter
          },
      ];
      const currentUrl = window.location.pathname;
      for (let blockedState of blockedStates) {
          if (currentUrl.match(blockedState.urlPattern)) {
              return true;
          }
      }
      return false;
    };
    $rootScope.getIntercomUserID = function(userId) {      
      let suffix = configConstant[configConstant.currEnvironment]?.INTERCOM_USERID_SUFFIX || '';
      if (!userId) {
          return userId;
      }  
      return parseFloat(userId + suffix);      
    }
  
    $rootScope.isReportExportDisabled = function(permissionName='') {
      let isReportExportDisabled = true;
      let session = auth.getSession();
      if (session.userType == "administrator") {
        isReportExportDisabled = false;
      } else if (session.hasOwnProperty(permissionName) && session[permissionName] == 1) {
        isReportExportDisabled = false;
      }
      return isReportExportDisabled;
    }
    $rootScope.isPayaMessageListenerAdded = {
      payment_profile_area: false,
      payment_listing_area: false,
      invoice_page: false,
    }
    let currEnvironment = configConstant.currEnvironment;
    $rootScope.PB_WEB_VERSION = configConstant[currEnvironment].webVersion;
    $rootScope.paymentGateWayNames = {
        paya: "Paya",
        nuvei: "Nuvei",
        ab: "AB"
    };
    let serverTitle = configConstant[currEnvironment].serverTitle;
    $rootScope.isLocalServer = serverTitle === 'local';
    $rootScope.isTestServer = serverTitle === 'test';
    $rootScope.isUatServer = serverTitle === 'uat';
    $rootScope.isPreprodServer = serverTitle === 'preprod';
    $rootScope.isLiveServer = serverTitle === 'live';
    $rootScope.isNppServer = serverTitle === 'npp';
    if ($rootScope.isPreprodServer || $rootScope.isLiveServer || $rootScope.isNppServer) {
      // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      $window.document.addEventListener('keydown', function(event) {
        if (
          event.key === "F12" || 
          (event.ctrlKey && event.shiftKey && event.key === "I") ||  // Disable Ctrl+Shift+I (Windows)
          (event.ctrlKey && event.shiftKey && event.key === "J") ||  // Disable Ctrl+Shift+J (Windows)
          (event.ctrlKey && event.key === "U") ||                    // Disable Ctrl+U (Windows)
          (event.metaKey && event.altKey && event.key === "I") ||    // Disable Cmd+Option+I (Mac)
          (event.metaKey && event.altKey && event.key === "J") ||    // Disable Cmd+Option+J (Mac)
          (event.metaKey && event.key === "U")                       // Disable Cmd+U (Mac)
        ) {
          event.preventDefault();
        }
      });
    }
    $rootScope.isNPPCompany = () => {
      let isNPPCompany = false;
      if ($state.current.name === 'quotes' || $state.current.name === 'invoice') {     
        let currentEnv = configConstant.currEnvironment; 
        let nppCompanies = configConstant[currentEnv]['nppCompanies'];
        let oldDomain = configConstant[currentEnv]['poolbrainProdDomain'];
        let newDomain = configConstant[currentEnv]['nppProdDomain'];
        let currentCompanyId = $stateParams.companyId ? $stateParams.companyId: '';
        if (nppCompanies.includes(currentCompanyId)) {
          if(window.location.hostname === oldDomain) {
            isNPPCompany = true;
            let oldUrl = window.location.href;
            let newUrl = oldUrl.replace(oldDomain, newDomain);
            window.location.href = newUrl;
            return isNPPCompany
          }
        }
      } else {
        return isNPPCompany
      }
    }
    // Department Dropdown
    $rootScope.isDepartmentListLoading = false;
    $rootScope.allDepartmentList = [];
    $rootScope.activeDepartmentList = [];
    $rootScope.noneDepartment = {
      "children": [],
      "id": 0,
      "isDepartment": true,
      "name": "None",
      "active": true
    }
    $rootScope.customerDetailEndpoint = $rootScope.isNppServer ? '/customer_details' : '/view_customer_detail';
    $rootScope.getDepartmentList = function() {
      $rootScope.allDepartmentList = [];
      $rootScope.activeDepartmentList = [];
      $rootScope.isDepartmentListLoading = true;
      apiGateWay.get('/department_list', {}).then(function(response) {
          if (response.data.status == 200) {
              $rootScope.allDepartmentList = response.data.data || [];              
              $rootScope.allDepartmentList.unshift($rootScope.noneDepartment);
              $rootScope.activeDepartmentList = $rootScope.allDepartmentList.filter(department => department.active);
          }
          $rootScope.isDepartmentListLoading = false;
      }, function(error){
          $rootScope.isDepartmentListLoading = false;
      })
    } 
    $rootScope.findDepartmentById = function (id) {
      if (!id) {
          return $rootScope.noneDepartment;
      }  
      function search(array) {
          for (let i = 0; i < array.length; i++) {
              if (array[i].id === id) {
                  return array[i];
              }
              if (array[i].children && array[i].children.length > 0) {
                  const found = search(array[i].children);
                  if (found) {
                      return found;
                  }
              }
          }
          return null;
      }  
      return search($rootScope.allDepartmentList || []) || $rootScope.noneDepartment;
    };
    // Department Dropdown
    var chargebeeInstance = Chargebee.getInstance();
     if(chargebeeInstance === undefined) {
        chargebeeInstance = window.Chargebee.init({
            site: "mannar-test"
        });
      }
      if(navigator.userAgent.indexOf("Firefox") != -1){ 
        document.documentElement.classList.add('is-firefox'); 
      } 
    /*Define Root Variables*/
    $rootScope.isOneTimeJobDataEditing = false;
    $rootScope.turnOnOneTimeJobEditing = function() {
      $rootScope.isOneTimeJobDataEditing = true;
    }
    $rootScope.turnOffOneTimeJobEditing = function() {
      $rootScope.isOneTimeJobDataEditing = false;
    }
    // settingPageLoaders
    $rootScope.settingPageLoaders = {};
    $rootScope.settingPageLoaders.logoSection = true;
    $rootScope.settingPageLoaders.emailSection = true;
    $rootScope.settingPageLoaders.emailSectionTemplate = true;
    $rootScope.settingPageLoaders.emailSectionTemplatesArea = true;
    $rootScope.settingPageLoaders.domainSection = true;
    $rootScope.settingPageLoaders.alertSection = true;        
    $rootScope.settingPageLoaders.qboSection = {};
    $rootScope.settingPageLoaders.qboSection.qboConnected = true;
    $rootScope.settingPageLoaders.qboSection.accountV1 = true;
    $rootScope.settingPageLoaders.qboSection.accountV2 = true;
    $rootScope.settingPageLoaders.qboSection.invoiceSyncToggle = false;
    $rootScope.settingPageLoaders.qboSection.productToggle = false;
    $rootScope.settingPageLoaders.qboSection.departmentToggle = false;
    $rootScope.settingPageLoaders.qboSection.incomeAccountUpdating = false;
    $rootScope.settingPageLoaders.qboSection.qboSyncing = false;
    $rootScope.settingPageLoaders.qboSection.companyPreferences = false;
    $rootScope.settingPageLoaders.qboSection.defaultAccount = false;
    $rootScope.settingPageLoaders.chemicalSettingSection = true;
    $rootScope.settingPageLoaders.invalidAddress = true;
    $rootScope.settingPageLoaders.serviceLevelSection = true;
    $rootScope.settingPageLoaders.technicianPaySection = true;
    $rootScope.settingPageLoaders.QuoteSettingSection = true;
    $rootScope.settingPageLoaders.jobScheduleSection = true;
    $rootScope.settingPageLoaders.payaSection = true;
    $rootScope.settingPageLoaders.billingSection = true;
    // settingPageLoaders
    $rootScope.crmStatus = {};
    $rootScope.qbConnectedNow = false;
    $rootScope.clients = [];
    $rootScope.currentState = $state.current.name;
    $rootScope.title = $state.current.title;
    $rootScope.onlineServiceMang = [];
    $rootScope.chemicalReadingServiceArray = [];
    $rootScope.waterBodyTypeDefault = [];
    $rootScope.waterBodies = [];
    $rootScope.getTechRole = ''; //function
    $rootScope.techName = '';
    $rootScope.watchPaymentMethodId = '';
    $rootScope.billingAddObj = {};
    $rootScope.listingTab = {};
    $rootScope.rootTransactionId = '';
    $rootScope.showSyncLog = '';
    //$rootScope.sChemReadingSeTab = '';
    //$rootScope.chemicalReadingSettingModel = []
    $rootScope.customerBillingData = {};
    $rootScope.activeSocket = function() {
      if (auth.getSession()) {

        $rootScope.userSession = auth.getSession();
        var userId = auth.getSession().userIdForSocket ? auth.getSession().userIdForSocket : auth.getSession().userId;
        var requestedCompanyId = auth.getSession().parentCompanyId ? auth.getSession().parentCompanyId : auth.getSession().companyId;
        if (auth.getSession().companyId == auth.getSession().parentCompanyId) {
          userId = auth.getSession().loggedInUserId;
        }
        var loggedInRole = auth.loggedInRole();
        // to start socket server on page refresh
        if (userId) {
          var socketServer = config.currentEnvironment.socketServer;
          console.log('Trying to connect socket')          
          console.log('Socket Server == ' + socketServer + "?userId=" + userId + "&requestedCompanyId=" + requestedCompanyId) 
          var socket = io.connect(socketServer + "?userId=" + userId + "&requestedCompanyId=" + requestedCompanyId, {transports:['websocket']});
          $rootScope.onlineServiceMangProcessing = true;
          socket.on("connect", function() {
            console.log('Socket connected!!!')
            socket.emit("refreshManagerList");
          });
          socket.on("disconnect", function() {
            console.log('Socket disconnected!!!')
            $rootScope.scope = {};
          });
          socket.on("json", function(data) {

          });

          socket.on("refreshManagerList", function(data) {
            var count = 0;
            $rootScope.onlineServiceMang = [];
            $rootScope.onlineServiceMang = Object.keys(data.users).map(
              function(key) {
                return data.users[key];
              }
            );
            $rootScope.onlineServiceMangProcessing = false;
            if (!$rootScope.$$phase) $rootScope.$apply();
          });
          socket.on("manager_response", function(data) {

          });
          $rootScope.socket = socket;
          Idle.watch();
        }
      }
    };

    if ($state.canActiveFor && $state.canActiveFor == "administrator") {

    } else {
      ga("create", config.currentEnvironment.googleAnalyticKey, "auto");
    }
    $rootScope.activeSocket();

    $rootScope.addAuditLog = function(jobId, actionName, dataType='') {
      if (auth.getSession()) {
        var userId = auth.getSession().userId;
        if (userId && auth.getSession().selectedCompany == auth.getSession().companyId){
          if ($rootScope.socket) {
            var auditLogData = { actionName: actionName, companyId: $rootScope.selectedCompany };
            if (dataType && dataType == 'remoteData') {
              auditLogData['waterguruDataId'] = jobId
            } else {
              auditLogData['jobId'] = jobId
            }
            auditLogData["actionBy"] = userId;
            auditLogData["byType"] = $rootScope.userSession.userRole ? $rootScope.userSession.userRole : $rootScope.userSession.companyRole;
            auditLogData["dataType"] = dataType;
            $rootScope.socket.emit("add_audit", auditLogData);
          }
        }
      }
    };
    $rootScope.addUpdateManager = function(action, jobId, dataType='') {
      if (auth.getSession()) {
        var userId = auth.getSession().userId;
        if (userId && auth.getSession().selectedCompany == auth.getSession().companyId){
          if ($rootScope.socket) {
            var auditLogData = { userId: userId, action: action };
            if (dataType && dataType == 'remoteData') {
              auditLogData['waterguruDataId'] = jobId
            } else {
              auditLogData['jobId'] = jobId
            }
            $rootScope.socket.emit("add_update_manager", auditLogData);
          }
        }
      }
    };

    $rootScope.openedJobId = 0;
    $rootScope.displayDropDown = true;
    $rootScope.preventDefaultAction = false;
    $rootScope.selectedCompany = 0;
    $rootScope.adminCompanyList = [];
    $rootScope.groupCompanyList = [];

    $rootScope.getCompanyList = function() {
      let _session = auth.getSession();
      apiGateWay.get("/administrator/company_list_superadmin", {
        companyGroupId: _session.companyGroupId,
        groupCompanyIds: _session.groupCompanyIds,
      }, { 
        headers: {          
          isSuperAdmin: _session.isSuperAdmin,
        }
      }).then(
        function(response) {
          var responseData = response.data;
          if (responseData.status == 200) {
            var responseResult = responseData.data;
            if (responseResult && responseResult.length > 0) {
              responseResult.forEach(company => {
                company.isCompanyHasFullSignUp = company.subscription_id != null && company.subscription_id != '';
              });
            }
            $rootScope.adminCompanyList = responseResult;
            var sessionData = auth.getSession();
            if (!sessionData.companyEmail) {
              sessionData.companyEmail = $rootScope.adminCompanyList.find(x => x.companyId == sessionData.selectedCompany).email;
              auth.setSession(sessionData);              
            }
          }
        },
        function(errorResponse) {}
      );
    };
    $rootScope.groupCompanyListLoaded = false;
    $rootScope.getGroupCompanyList = function(companyId) {
      apiGateWay.get("/group_company_list").then(
        function(response) {
          $rootScope.groupCompanyListLoaded = true;
          var responseData = response.data;
          if (responseData.status == 200) {
            var responseResult = responseData.data || [];                  
            if (responseResult && responseResult.length > 0) {
              responseResult.forEach(company => {
                company.isCompanyHasFullSignUp = company.subscription_id != null && company.subscription_id != '';
              });
            }              
            $rootScope.groupCompanyList = responseResult;
            var sessionData = auth.getSession();
            if (!sessionData.companyEmail) {
              sessionData.companyEmail = $rootScope.adminCompanyList.find(x => x.companyId == sessionData.selectedCompany).email;
              auth.setSession(sessionData);              
            }
          }
        },
        function(errorResponse) {
          $rootScope.groupCompanyListLoaded = true;
        }
      );
    };

    if (auth.getSession()) {

      if (auth.getSession().userType == "administrator") {
        $rootScope.getCompanyList();
      }
      if (auth.getSession().userType != "administrator" && auth.getSession().canAccessMultiCompany) {
        $rootScope.getGroupCompanyList();
      }
      companyService.selectedCompany = $rootScope.selectedCompany = auth.getSession().selectedCompany;
      // $rootScope.preventDefaultAction =
      //   auth.getSession().companyId == auth.getSession().selectedCompany
      //     ? false
      //     : true;
    }

    $rootScope.setCompany = function(selectedCompany, isGroupCompany=false) {
      auth.deleteStorage('defaultRouteFilterTemplateSession');
      auth.deleteStorage('defaultAlertFilterTemplateSession');
      $rootScope.socket.disconnect();
      $rootScope.onlineServiceMang = [];
      $rootScope.isQboAccountsFetched = false;
      AwsConfigService.resetAwsConfigPromise();      
      let companyList = [];
      if (!isGroupCompany) {
        companyList = $rootScope.adminCompanyList;
      } else {
        companyList = $rootScope.groupCompanyList;
      }
      let _companyInfo = companyList.find(x => x.companyId == selectedCompany);      
      var sessionData = auth.getSession();
      sessionData.selectedCompany = _companyInfo.companyId;
      sessionData.companyId = _companyInfo.companyId;      
      sessionData.isUserOfMultiCompany = _companyInfo.isUserOfMultiCompany;
      if (!isGroupCompany) {
        sessionData.companyEmail = _companyInfo.email;
        sessionData.userId = _companyInfo.userId;
      }      
      sessionData.userIdForSocket = _companyInfo.userId;
      sessionData.isCompanyHasFullSignUp = _companyInfo.isCompanyHasFullSignUp;      
      $rootScope.isCompanyHasFullSignUp = _companyInfo.isCompanyHasFullSignUp;
      auth.setSession(sessionData);      
      $rootScope.userSession = sessionData;
      let date =  moment().format('YYYY-MM-DD');
      auth.setStorage('storedMapDate', date);
      companyService.selectedCompany = $rootScope.selectedCompany = _companyInfo.companyId;
      $rootScope.getdefaultRouteFilterTemplate(true);
      $rootScope.getdefaultAlertFilterTemplate(true);
      $rootScope.activeSocket();
      if ($state.current.name != "app.technicians" && $state.current.name != "app.customer" && $state.current.name != "app.dashboard") {

          $state.go('app.dashboard');
      }else{
        $rootScope.$emit("companySelected");
      }


    };
    $rootScope.showCompanyById = function (companyId) {
      if (companyService.selectedCompany && companyService.selectedCompany != companyId) {
        var sessionData = auth.getSession();
        if (sessionData && sessionData.canAccessMultiCompany) {
          companyService.selectedCompany = $rootScope.selectedCompany = companyId;
          sessionData.companyId = companyId;
          auth.setSession(sessionData);
        }
      }
    };
    $rootScope.getdefaultRouteFilterTemplate = function(fromServer=true) {
      $rootScope.defaultRouteFilterTemplate = auth.getStorage('defaultRouteFilterTemplateSession') ? JSON.parse(auth.getStorage('defaultRouteFilterTemplateSession')) : null;
      if (fromServer) {    
        let session = auth.getSession();
        if (session && session.token && session.isCompanyHasFullSignUp) {
          apiGateWay.get("/route_filter_template?getDefaultTemplate=true").then(
            function(response) {
              if (response.data.status == 200) {
                  let resData = response.data.data && response.data.data.Data ? response.data.data.Data : [];
                  if (resData.length > 0) {
                    $rootScope.defaultRouteFilterTemplate = resData[0];
                    auth.setStorage('defaultRouteFilterTemplateSession', resData[0]);   
                  } else {
                    $rootScope.defaultRouteFilterTemplate = null;
                    auth.deleteStorage('defaultRouteFilterTemplateSession');                      
                  }
              }
            }
          ); 
        }            
      }    
    }
    $rootScope.getdefaultRouteFilterTemplate(true);
    $rootScope.getdefaultAlertFilterTemplate = function(fromServer=true, reloadPage=false) {
      $rootScope.defaultAlertFilterTemplate = auth.getStorage('defaultAlertFilterTemplateSession') ? JSON.parse(auth.getStorage('defaultAlertFilterTemplateSession')) : null;
      if (fromServer) {    
        let session = auth.getSession();
        if (session && session.token && session.isCompanyHasFullSignUp) {
          apiGateWay.get("/job_alerts_filter?getDefaultTemplate=true").then(
            function(response) {
              if (response.data.status == 200) {
                  let resData = response.data.data && response.data.data.Data ? response.data.data.Data : [];
                  if (resData.length > 0) {
                    $rootScope.defaultAlertFilterTemplate = resData[0];
                    auth.setStorage('defaultAlertFilterTemplateSession', resData[0]);   
                  } else {
                    $rootScope.defaultAlertFilterTemplate = null;
                    auth.deleteStorage('defaultAlertFilterTemplateSession');                      
                  }                  
              } 
              if (reloadPage) {
                $state.go('app.dashboard', {}, {
                  reload: true
                });                
              }             
            }
          ); 
        }            
      }    
    }
    $rootScope.openAlertDashboard = function() {
      $rootScope.getdefaultAlertFilterTemplate(true, true);
    }
    $rootScope.getdefaultAlertFilterTemplate(true);
    $rootScope.$on("$stateChangeStart", function(
      event,
      toState,
      toParams,
      fromState,
      fromParams
    ) {
      // add responsive class
      let _htmlElement = document.getElementsByTagName('html');
      let _bodyElement = document.getElementsByTagName('body');
      let _html = _htmlElement[0];
      let _body = _bodyElement[0];
      let _responsivePages = [
        { state: 'login', isAuthPage: true },
        { state: 'forgot-password', isAuthPage: true },
        { state: 'signup', isAuthPage: true },
        { state: 'pladminlogin', isAuthPage: true, isNoAuthBg: true },
        { state: 'user-signup', isAuthPage: true, isNoAuthBg: true },
        // { state: 'app.companysignup' },
        { state: 'app.dashboard' },
        // { state: 'app.customer' },
        // { state: 'app.technicians' },
        // { state: 'app.usermanagement' },
        // { state: 'technicianroute' },
        // { state: 'app.reports' },
        // { state: 'app.onetimejoblist' },
        // { state: 'app.quotelistingSingle' },
        // { state: 'app.invoicelistingSingle' },
        // { state: 'app.paymentlistingSingle' },
        // { state: 'app.alertsmanagement' },
        // { state: 'app.companysettings' },
        // { state: 'app.products' },
        // { state: 'app.profile' },
        { state: 'app.emailcenter' },
        { state: 'unsubscribeEmails' },
        { state: 'app.trucks' },
        { state: 'app.inventory' },
      ];
      let _responsiveClass = 'pb-app';
      let _authPageClass = 'authPage';
      let _authPageNoBgClass = 'authPage-no-bg';
      let _targetPageState= toState.name;
      if (_html) {
        _html.classList.remove(_responsiveClass);
        _body.classList.remove(_authPageClass);
        _body.classList.remove(_authPageNoBgClass);
        let isStateResponsive = _responsivePages.find(page => page.state === _targetPageState);
        if (isStateResponsive) {
          _html.classList.add(_responsiveClass);
          if (isStateResponsive.isAuthPage) {
            _body.classList.add(_authPageClass);            
          } 
          if (isStateResponsive.isNoAuthBg) {
              _body.classList.add(_authPageNoBgClass);
          }
        }
      }       
      //
      if ($rootScope.closeisFullScreenSearchBox && typeof $rootScope.closeisFullScreenSearchBox === 'function') {
        $rootScope.closeisFullScreenSearchBox();
      } 
      if (window.innerWidth <= 1200) {
        $rootScope.sidebarOpened = false;     
      }
      pendingRequests.cancelAll();
      /* close all model on logout */
      if (toState.name == "pladminlogin" || toState.name == "login") {
        ngDialog.closeAll();
      }
      if (toState.name == "technicianroute" && fromState.name != '') {
        $rootScope.getdefaultRouteFilterTemplate();
      }
      if (toState.name == "app.dashboard" && fromState.name != '') {
        $rootScope.getdefaultAlertFilterTemplate(true);
      }
      if (toState.name == 'app.customerdetail' || toState.name == 'app.customerinvoicedetail') {
        $rootScope.getDepartmentList();
      }

      
      if (fromState.url.indexOf("customerjobdetail") !== -1) {

        $rootScope.addUpdateManager("remove", fromParams.jobId);
      }
      if (toState.authRequired && !auth.isAuthenticated()) {
        event.preventDefault();
        
        if (toState.name != "pladminlogin") {
          $state.go("login", {}, { reload: true });
        } else {
          $state.go("pladminlogin", {}, { reload: true });
        }
      }
      
      var role = auth.loggedInRole();
      var sessionData = auth.getSession();
      $rootScope.canDismissAlerts = sessionData.canDismissAlerts ? false : true;
      if (role != "administrator") {
        $rootScope.preventDefaultAction = role == "viewer" ? true : false;
      }

      if ($rootScope.openedJobId != 0 && $rootScope.openedJobId != "") {
        $rootScope.addUpdateManager("remove", $rootScope.openedJobId);
      }
      var session = auth.getSession();
      if (
        (auth.isAuthenticated() && !toState.authRequired && !toState.visibleAfterLogin ) ||
        (auth.isAuthenticated() && toState.canActiveFor.indexOf(role) == -1 && !toState.visibleAfterLogin)
      ) {
        if(toState.name != "tech_rating" && toState.name!='user-signup' && toState.name != "unsubscribeEmails"){
          event.preventDefault();
          
          if (role == "user") {
            if(!session.isCompanyHasFullSignUp){
              $state.go("app.companysignup", {}, { reload: true });
            }else{
              $state.go("app.cdashboard", {}, { reload: true });
            }
          } else if (role == "companyadmin" && !session.isCompanyHasFullSignUp) {
            $state.go("app.companysignup", {}, { reload: true });

          } else {
            $state.go("app.dashboard", {}, { reload: true });
          }
        }else{
          if(toState.name=='user-signup'){
            $rootScope.doContinueBrowser();
          }
        }

      }

      $rootScope.title = '';
      $rootScope.isActive = '';
      $rootScope.subTitle = toState.title;
      $rootScope.currentState = toState.name;
      $rootScope.rootJobId= "";
      $rootScope.rootDeviceId = "";
      var userData = auth.getSession();

      if (auth.loggedInRole() != "administrator") {
        Analytics.set("userId", userData.id);
        var analyticsData = {};
        analyticsData.userData = userData;
        analyticsData.pageData = {
          toState: toState,
          params: toParams
        };
        analyticsData.actionTime = new Date();
        var analyticsDataString = JSON.stringify(analyticsData);
        var analyticTitle = toState.title;
        analyticTitle =
          analyticTitle == "Customers - " ? "Customer Detail" : analyticTitle;
      }
      if (toState.name != "app.dashboard") {
        $rootScope.getCrmStatus();
      }
    });

    $rootScope.checkNRedirectRoute = function(toState) {
      if (
        toState.canActiveFor &&
        toState.canActiveFor == "administrator" &&
        toState.authRequired &&
        !auth.isAuthenticated()
      ) {
        $state.go("pladminlogin", {}, { reload: true });
      } else if (!auth.isAuthenticated()) {
        $state.go("login", {}, { reload: true });
      } else if (auth.isAuthenticated()) {
        var role = auth.loggedInRole();
        if (role == "administrator") {
          $state.go("administrator.dashboard", {}, { reload: true });
        } else {
          $state.go("app.dashboard", {}, { reload: true });
        }
      }
      return false;
    };

    //common function to store analytic detail
    $rootScope.storeAnalytics = function(
      category,
      title,
      data,
      index,
      boolVal,
      custom
    ) {
      index = index || 0;
      boolVal = boolVal || false;

      if (custom == undefined || custom == "") {
        if (auth.getSession() && auth.getSession().id) {
          var userData = auth.getSession();
          Analytics.set("userId", userData.id);
          custom = {
            dimension1:
              userData.id + " - " + userData.firstName + " " + userData.lastName
          };
        }
      }
      Analytics.trackEvent(category, title, data, index, boolVal, custom);
    };
    //to parse name with '...' if its length is greater than given value
    $rootScope.parseName = function(name, length) {
      var customerName = name;
      if (name != undefined && name != "") {
        if (name.length > length) {
          customerName = name.substring(0, length) + "...";
        }
      }
      return customerName;
    };
    /*
           start
           the below statements are for idle cases which show warning pop up to login user if user is idle for 20 mins
        */    
    $rootScope.events = [];
    $rootScope.idle = 10000;
    $rootScope.countdown = $rootScope.timeout = 2000;
    $rootScope.isAlertShow = false;
    //idle start
    $rootScope.$on("IdleStart", function() {

    });
    //idle end
    $rootScope.$on("IdleEnd", function() {

    });
    //to show alert warning
    $rootScope.$on("IdleWarn", function(e, countdown) {
      if (countdown == 20) {
        ngDialog.open({
          template: "idle.html",
          className: "ngdialog-theme-default",
          scope: $rootScope,
          preCloseCallback: function() {
            $rootScope.isAlertShow = false;
            $rootScope.countdown = $rootScope.timeout;
          }
        });
        $rootScope.isAlertShow = true;
      }
      $rootScope.countdown = countdown;
      if (!$rootScope.$$phase) $rootScope.$apply();
    });
    $rootScope.$on("IdleTimeout", function() {
      ngDialog.close();
      $rootScope.doLogout();
    });
    $rootScope.reset = function() {
      Idle.watch();
    };
    //to watch idle value
    $rootScope.$watch("idle", function(value) {
      if (value !== null) Idle.setIdle(value);
    });
    // to watch timeout value
    $rootScope.$watch("timeout", function(value) {
      if (value !== null) Idle.setTimeout(value);
    });
    /* end */
    //function to logout user
    $rootScope.doLogout = function() {
      //logout from chargbee
      var chargebeeInstance = window.Chargebee.getInstance();
      chargebeeInstance.logout();
      if($rootScope.recheckPendingJob)
      {
        clearInterval($rootScope.recheckPendingJob);
      }
      var userData = auth.getSession();
      var userRole = JSON.parse(JSON.stringify(auth.loggedInRole()));
      var currLoca = $location.absUrl().split("?")[0];
      if (currLoca.indexOf("customerjobdetail") !== -1) {
        var jobId = currLoca.split("/");
        $rootScope.addUpdateManager("remove", jobId[6]);
      }
      var logoutUrl =
        userRole == "administrator" ? "/administrator/logout" : "/logout";
      setTimeout(function() {
        $rootScope.socket.disconnect();
      }, 1000);
      if (userData) {
        var userId = userData.id;
        apiGateWay
          .send(logoutUrl, {
            userId: userId
          })
          .then(function(response) {
            if (response.data.status == 200) {

            }
          });
        Analytics.set("logoutUserData", userData);
        var AnalyticsData = {};
        userData.actionTime = new Date();
        var currentDateTime = $filter("date")(
          new Date(),
          "dd/MM/yyyy hh:m:ss a"
        );
        $rootScope.storeAnalytics(
          "Logout",
          "User Logout - " + currentDateTime,
          JSON.stringify(userData),
          userData.id,
          true
        );
        auth.logout();
        $intercom.shutdown();
        var currEnvironment = configConstant.currEnvironment;        
        if (!$rootScope.isIntercomBlockedState()) {
          $intercom.boot({app_id:configConstant[currEnvironment].INTERCOM_APPID});
        }
        if (userRole == "administrator") {
          $state.go("pladminlogin");
        } else {
          $state.go("login");
        }
      }
    };
    $rootScope.logoutInterval = null;
    $rootScope.doLogoutBrowser = function(isAutoLogout,userSignup=false) {
      var chargebeeInstance = window.Chargebee.getInstance();
      chargebeeInstance.logout();
      if (isAutoLogout && auth.isAuthenticated()) {
        if (!$rootScope.isOpen) {
          $rootScope.isOpen = true;
          ngDialog.open({
            template: "templates/logoutNotification.html?ver="+$rootScope.PB_WEB_VERSION,
            className: "ngdialog-theme-default",
            scope: $rootScope,
            closeByDocument: false,
            preCloseCallback: function() {
              $rootScope.logoutInterval = setTimeout(function(){                
                logout();
              }, 0)
              $rootScope.isOpen = false;
            }
          });
        }
      } else {
        logout();
      }
    };

    $rootScope.doContinueBrowser = function() {
      if (auth.isAuthenticated()) {
        if (!$rootScope.isCntOpen) {
          $rootScope.isCntOpen = true;
          ngDialog.open({
            template: "templates/tokenNotification.html?ver="+$rootScope.PB_WEB_VERSION,
            className: "ngdialog-theme-default",
            scope: $rootScope,
            closeByDocument: false,
            preCloseCallback: function() {
              $rootScope.isCntOpen = false;
              $state.go("app.dashboard", {}, { reload: true });
            }
          });
        }
      }
    };
    $rootScope.logoutUser = function() {      
      logout();
    };


    var logout = function() {
      if ($rootScope.logoutInterval) { clearInterval($rootScope.logoutInterval) }
      var userData = auth.getSession();
      if (userData) {
        var userId = userData.id;
        setTimeout(function() {
          $rootScope.socket.disconnect();
        }, 1000);
        Analytics.set("logoutUserData", userData);
        var AnalyticsData = {};
        userData.actionTime = new Date();
        var currentDateTime = $filter("date")(
          new Date(),
          "dd/MM/yyyy hh:m:ss a"
        );
        $rootScope.storeAnalytics(
          "Logout",
          "User Logout - " + currentDateTime,
          JSON.stringify(userData),
          userData.id,
          true
        );
        auth.logout();
        $state.go("login");
      }
    };

    // other tab logout
    function getCookie(cname) {
      let name = cname + "=";
      let decodedCookie = decodeURIComponent(document.cookie);
      let ca = decodedCookie.split(';');
      for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
          c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    }
    function setCookie(cname, cvalue, domain, path = '/', expires = '') {
      let cookieStr = `${cname}=${cvalue}; path=${path}; domain=${domain}`;
      if (expires) {
        cookieStr += `; expires=${expires}`;
      }
      document.cookie = cookieStr;
    }
    function deleteCookie(cname, domain, path = '/') {
      document.cookie = `${cname}=; path=${path}; domain=${domain}; expires=Thu, 01 Jan 1970 00:00:00 UTC`;
    }    
    function getFilteredIntercomSession(session) {
      return {
        email: session.email,
        user_id: $rootScope.getIntercomUserID(session.id),
        name: session.firstName + ' ' + session.lastName,
        createdAt: session.createTime,        
        loggedInTime: session.loggedInTime
      };
    }
    let _existingSessionStr = getCookie('session') ? getCookie('session') : '{}';
    var _existingSession = JSON.parse(_existingSessionStr);
    var _existingSessionToken = _existingSession.email ? _existingSession.email : '';
    function listenCookieChange(callback, interval = 1000) {
      setInterval(()=> {
        var _configData = configConstant[currEnvironment];
        if (_existingSessionStr !== '{}') {
          let _filteredIntercomSession = getFilteredIntercomSession(JSON.parse(_existingSessionStr));
          setCookie(_configData.INTERCOM_COOKIE, JSON.stringify(_filteredIntercomSession), _configData.INTERCOM_COOKIE_DOMAIN);
        } else {
          deleteCookie(_configData.INTERCOM_COOKIE, _configData.INTERCOM_COOKIE_DOMAIN);
          deleteCookie('intercom-session-'+_configData.INTERCOM_APPID, _configData.INTERCOM_COOKIE_DOMAIN);
        }
        let _newSessionStr = getCookie('session') ? getCookie('session') : '{}';
        var _newSession = JSON.parse(_newSessionStr);
        var _newSessionToken = _newSession.email ? _newSession.email : '';
        if (_newSessionToken !== _existingSessionToken) {
          try {
            callback({oldValue: _existingSessionToken, newValue: _newSessionToken});
          } finally {
            _newSessionToken = _newSessionToken ? _newSessionToken : '';
            }
          }
        }, interval);
    }
    listenCookieChange(({oldValue, newValue})=> {       
          $state.reload();
          _existingSessionStr = getCookie('session') ? getCookie('session') : '{}';
          _existingSession = JSON.parse(_existingSessionStr);
          _existingSessionToken = _existingSession.email ? _existingSession.email : '';          
    }, 1000);
    // other tab logout
  })
  //Setup intercom chat
  .config(function($intercomProvider, configConstant) {
    var currEnvironment = configConstant.currEnvironment;
    $intercomProvider.appID(configConstant[currEnvironment].INTERCOM_APPID);
    $intercomProvider.asyncLoading(true)
  }).run(function($rootScope, $intercom, auth) {
    var userData = auth.getSession();     
    if (!$rootScope.isIntercomBlockedState()) {
      $intercom.boot({
        name: userData.firstName,
        email: userData.email,
        created_at: userData.createTime, 
        user_id: $rootScope.getIntercomUserID(userData.userId)
      })    
    }
  });
/* Application Ends */