angular.module('POOLAGENCY')

    .controller("authController", ["$scope", "$rootScope", "$state", "auth", "apiGateWay", "$filter", "config", function ($scope, $rootScope, $state, auth, apiGateWay, $filter, config) {
        if ($state.params.signUpPageData && !$state.params.signUpPageData.isLoadedFromSignupLink) {
            $state.go('login');
        }
        $scope.signupModel = {
            "email": "",
            "firstName": "",
            "lastName": "",
            "password": "",
            "cPassword": "",
            "phoneNumber": "",
            "profileImage": "",
            "acceptedNotifications": false,
            "acceptedTerms": false,
            "role": ['servicemanager']
        };
        $scope.browseImage = function () {
            document.getElementById('image').click();
        };
        $scope.uploadFile = function () {
            var imageData = $scope.image;
            $scope.signupModel.profileImage = 'data:image/png;base64,' + imageData.base64;
        };
        //scope signup function to perform signup
        $scope.doSignup = function () {
            if ($scope.signupForm.$valid) {
                $scope.isProcessing = true;
                apiGateWay.send("/signup", $scope.signupModel).then(function (response) {
                    if (response.data.status == 201) {
                        $scope.success = response.data.message;
                        $scope.error = '';
                        $scope.isProcessing = false;
                        var analyticsData = {};
                        analyticsData.userData = $scope.signupModel;
                        delete analyticsData.userData.profileImage;
                        analyticsData.actionTime = new Date();
                        var analyticsDataString = JSON.stringify(analyticsData);
                        var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                        $rootScope.storeAnalytics('SignUp', "New User Signup with Poolagency - " + $scope.signupModel.email + " - " + currentDateTime, analyticsDataString, 0, true);
                        setTimeout(function () {
                            $state.go('login');
                        }, 1000);
                    } else {
                        $scope.success = '';
                        $scope.error = response.data.message;
                        $scope.isProcessing = false;
                        var analyticsData = {};
                        analyticsData.userData = $scope.signupModel;
                        delete analyticsData.userData.profileImage;
                        analyticsData.actionTime = new Date();
                        analyticsData.errorData = response.data;
                        var analyticsDataString = JSON.stringify(analyticsData);
                        var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                        $rootScope.storeAnalytics('Error - SignUp', "Error on New User Signup with Poolagency - " + $scope.error + " - " + currentDateTime, analyticsDataString, 0, true);
                        setTimeout(function () {
                            $scope.error = '';
                        }, 2000);
                    }
                }, function (error) {
                    var msg = 'Unable to signup.';
                    if (typeof error == 'object' && error.data && error.data.message) {
                        msg = error.data.message;
                    } else {
                        msg = error;
                    }
                    var analyticsData = {};
                    analyticsData.userData = $scope.signupModel;
                    delete analyticsData.userData.profileImage;
                    analyticsData.actionTime = new Date();
                    analyticsData.errorData = error;
                    var analyticsDataString = JSON.stringify(analyticsData);
                    var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                    $rootScope.storeAnalytics('Error - SignUp', "Error on New User Signup with Poolagency - " + msg + " - " + currentDateTime, analyticsDataString, 0, true);
                    $scope.success = '';
                    $scope.error = msg;
                    $scope.isProcessing = false;
                    setTimeout(function () {
                        $scope.error = '';
                    }, 2000);
                });
            }
        };

    }])



    .controller("authLoginController", ["$scope", "$rootScope", "$state", "auth", "apiGateWay", "$filter", "ngDialog", "config", "companyService", "$intercom", "configConstant", function ($scope, $rootScope, $state, auth, apiGateWay, $filter, ngDialog, config, companyService, $intercom, configConstant) {
        $scope.goToSignUp = () => {
            $state.go('signup', {
                signUpPageData: {
                    isLoadedFromSignupLink: true
                }
            });
        }
        $scope.loginModel = {
            email: '',
            password: '',
            remember_me: false
        };
        try {
            var CookieData = auth.getStorage("loginFormData");
            if (CookieData) {
                if (typeof CookieData == 'string') {
                    CookieData = JSON.parse(CookieData);
                }
                $scope.loginModel = CookieData;
            }
        } catch (error) {

        }
        $scope.isProcessing = false;
        $scope.success = '';
        $scope.error = '';
        $scope.custId = '';
        $scope.showSubError = '';
        let currEnvironment = configConstant.currEnvironment;
        
        $scope.openSubPopup = function(){
            $scope.showSubError = '';
            if($scope.custId){
                var chargebeeInstance = window.Chargebee.getInstance();            
                var errmsg = $scope.custId + ' not found';
                chargebeeInstance.setPortalSession(function(){
                    return apiGateWay.send("/create_portal_session",{customer_id: $scope.custId}).then(function(response) {
                        var responseData = response.data;                   
                        if(responseData.message && responseData.message == errmsg){
                          setTimeout(function(){document.getElementById('chargebee-plan').click();},1000);                                                                
                        }
                        return responseData.data;
                     },function(errorResponse) {
                      if(errorResponse == errmsg){
                        setTimeout(function(){document.getElementById('chargebee-plan').click();},1000);                                                                
                      }      
                    });
              }); 
                var cbPortal = chargebeeInstance.createChargebeePortal();
                cbPortal.open({
                close: function() {
                    //close callbacks
                }
                });
            }
        }

        //scope login function to perform super admin login
        $scope.doLogin = function () {
            if ($scope.loginForm.$valid) {
                $scope.isProcessing = true;
                $scope.custId = '';
                $scope.showSubError = '';
                auth.login($scope.loginModel).then(function (response) {
                    try{
                    $rootScope.groupCompanyList = [];
                    $rootScope.activeSocket();
                    $scope.success = response.data.message;
                    $scope.error = '';
                    var userData = JSON.stringify(response.data.data);
                    userId = response.data.data.id;
                    companyService.selectedCompany = $rootScope.selectedCompany = response.data.data.companyId;
                    var isCompanyHasFullSignUp = response.data.data.isCompanyHasFullSignUp;
                    var customerPaymentProfileId = response.data.data.customerPaymentProfileId;
                    var userRole = response.data.data.roles[0].key;
                    var chatUser = {
                        name: response.data.data.firstName,
                        email: response.data.data.email,  
                        user_id: $rootScope.getIntercomUserID(userId)
                    }          
                    $intercom.update(chatUser);
                    let session = auth.getSession();
                    if (session.userType != 'administrator' && isCompanyHasFullSignUp) {
                        $rootScope.getGroupCompanyList(session.companyId);
                        if (session.canAccessMultiCompany && session.canAccessMultiCompany == 1) {
                            companyService.selectedCompany = $rootScope.selectedCompany = auth.getSession().selectedCompany;
                        }
                      }
                    if (!isCompanyHasFullSignUp && (userRole == 'companyadmin' || userRole == 'user')) {
                        $state.go('app.companysignup');
                    } else {
                        $state.go('app.dashboard');
                        $rootScope.getdefaultRouteFilterTemplate();
                        $rootScope.getdefaultAlertFilterTemplate();
                    }
                  }catch(e){
                      var msg = 'Unable to login.';
                      if (error && error.data && error.data.message) {
                          msg = error.data.message;
                      }
                      $scope.isProcessing = false;
                      $scope.success = '';
                      $scope.error = msg;
                      setTimeout(function () {
                          $scope.error = '';
                      }, 2000);
                  }
                }, function (error) {
                    var msg = 'Unable to login.';
                    if (error && error.data && error.data.message) {
                        if(error.data.message.custId){
                            // Ask for Reactivate subscription
                            msg = ''
                            $scope.custId = error.data.message.custId;
                            $scope.showSubError = true;
                        }else{
                            msg = error.data.message;
                        }
                        
                    }
                    $scope.isProcessing = false;
                    $scope.success = '';
                    $scope.error = msg;
                    setTimeout(function () {
                        $scope.error = '';
                    }, 2000);
                });
            }
        };

        var openCheckCompanyCreateModal = function () {
            ngDialog.open({
                template: 'askForCompanyCreate.html',
                className: 'ngdialog-theme-default',
                closeByDocument: false,
                scope: $scope,
                preCloseCallback: function (data) {
                    if (!(data == 'close' && data == '$closeButton')) {
                        $state.go('app.cdashboard');
                    }
                }
            });
        }

        $scope.closeModal = function () {
            ngDialog.close();
        }

        $scope.createCompany = function () {
            $scope.closeModal()
            setTimeout(function () {
                $state.go('app.companysignup');
            }, 1000);

        }


        //openCheckCompanyCreateModal();

        var forgotModel = {
            email: ''
        };
        $scope.forgotModel = angular.copy(forgotModel);
        $scope.doForgot = function () {
            if ($scope.forgotForm.$valid) {
                $scope.isProcessing = true;
                apiGateWay.send("/forgotPassword", $scope.forgotModel).then(function (response) {
                    if (response.data.status == 201) {
                        $scope.success = response.data.message;
                        $scope.error = '';
                        setTimeout(function () {
                            $scope.success = '';
                            $scope.error = '';
                            if (!$scope.$$phase) $scope.$apply();
                        }, 2000);
                        $scope.isProcessing = false;

                        $scope.forgotForm.$setPristine();
                        $scope.forgotForm.$setUntouched();
                        $scope.forgotModel = angular.copy(forgotModel);

                        if (!$scope.$$phase) $scope.$apply();

                        var analyticsData = {};
                        analyticsData.userData = $scope.forgotModel;
                        delete analyticsData.userData.profileImage;
                        analyticsData.actionTime = new Date();
                        var analyticsDataString = JSON.stringify(analyticsData);
                        var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                        $rootScope.storeAnalytics('ForgotPassword', "Forgot Password - " + $scope.forgotModel.email + " - " + currentDateTime, analyticsDataString, 0, true);
                    } else {
                        $scope.success = '';
                        $scope.error = response.data.message;
                        $scope.isProcessing = false;
                        setTimeout(function () {
                            $scope.error = '';
                            if (!$scope.$$phase) $scope.$apply();
                        }, 2000);
                        var analyticsData = {};
                        analyticsData.userData = $scope.forgotModel;
                        delete analyticsData.userData.profileImage;
                        analyticsData.actionTime = new Date();
                        analyticsData.errorData = response.data;
                        var analyticsDataString = JSON.stringify(analyticsData);
                        var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                        $rootScope.storeAnalytics('Error - ForgotPassword', "Error on ForgotPassword with Poolagency - " + $scope.error + " - " + currentDateTime, analyticsDataString, 0, true);
                    }
                }, function (error) {
                    var msg = 'Unable to process.';

                    if (typeof error == 'object' && error.data && error.data.message) {
                        msg = error.data.message;
                    } else {
                        msg = error;
                    }
                    setTimeout(function () {
                        $scope.error = '';
                        if (!$scope.$$phase) $scope.$apply();
                    }, 2000);
                    var analyticsData = {};
                    analyticsData.userData = $scope.forgotModel;
                    delete analyticsData.userData.profileImage;
                    analyticsData.actionTime = new Date();
                    analyticsData.errorData = error;
                    var analyticsDataString = JSON.stringify(analyticsData);
                    var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
                    $rootScope.storeAnalytics('Error - ForgotPassword', "Error on ForgotPassword with Poolagency - " + msg + " - " + currentDateTime, analyticsDataString, 0, true);
                    $scope.success = '';
                    $scope.error = msg;
                    $scope.isProcessing = false;

                });
            }
        };
        $scope.user = {};
        $scope.user.log = closeModal;

        function closeModal() {
            $cope.test = "aaa";
        }



    }]).controller("tokenSignupController", [
        "$scope",
        "$rootScope",
        "$state",
        "auth",
        "apiGateWay",
        "$filter",
        "ngDialog",
        "config",
        "$location",
        function (
            $scope,
            $rootScope,
            $state,
            auth,
            apiGateWay,
            $filter,
            ngDialog,
            config,
            $location
        ) {
            var t = $location.search()["t"];
            $scope.isProcessing = false;
            $scope.cropperType= "circle";
            $scope.myCroppedImage = '';
            $scope.signupModel = {
                email: "",
                firstName: "",
                lastName: "",
                password: "",
                cPassword: "",
                phoneNumber: "",
                profileImage: "",
                code: ""


            };
            $scope.browseImage = function () {
                document.getElementById("image").value = '';
                document.getElementById('image').click();
            };
           
             
            $scope.uploadFile = function () {
                $scope.imageError="";
                var imageType = ["image/gif", "image/jpeg","image/png"];
                var imageData = $scope.image;
                $scope.myimage = 'data:image/png;base64,' + imageData.base64;
                $scope.imageError = "";
                if(imageType.indexOf($scope.image['filetype']) !== -1)
                {

                    //Added image croppper popup
                    ngDialog.open({
                        template: 'templates/crop-image.html?ver=' + $rootScope.PB_WEB_VERSION,
                        className: 'ngdialog-theme-default',
                        closeByDocument: false,
                        scope: $scope,
                        preCloseCallback: function (data) {
                            //if (!(data == 'close' && data == '$closeButton')) {
                                if (data != 'close') {
                                    $scope.myimage = $scope.signupModel.profileImage = data;
            
                                }else{
                                    $scope.myimage ="";
                                }
                        }
                    });
                   
                }else{
                    $scope.signupModel.profileImage = '';
                    $scope.myimage ="";
                    $scope.imageError="Invalid file format";
                }
            };
            if (!t) {
                $state.go("login");
            } else {
                $scope.isProcessing = true;
                apiGateWay
                    .get("/check_reset_token", {
                        code: t
                    })
                    .then(function (response) {
                        if (response.status != 200) {

                            $scope.error = "Your link has expired";

                            setTimeout(function () {
                                $state.go("login");
                            }, 1500);

                        }else{

                            $scope.signupModel = response.data.data.user;
                            if (!$scope.$$phase) $scope.$apply();
                        }
                        $scope.isProcessing = false;
                    }, function (error) {

                        var msg = "Unable to process.";
                        if (typeof error == "object" && error.data && error.data.message) {
                          msg = error.data.message;
                        } else {
                          msg = error;
                        }
                        $scope.success = "";
                        $scope.error = msg;
                        $scope.isProcessing = false;


                    });
            }
            $scope.removeProfilePicture = function(){
                $scope.signupModel.profileImage = '';
            }
            $scope.success = "";
            $scope.error = "";
            //scope login function to perform super admin login

            //openCheckCompanyCreateModal();


            // $scope.signupModel = angular.copy(signupModel);
            $scope.doTokenSignup = function () {
                if ($scope.signupForm.$valid) {
                    $scope.isProcessing = true;
                    $scope.signupModel['code'] = t;
                    apiGateWay.send("/user_signup", $scope.signupModel).then(
                        function (response) {
                            if (response.data.status == 201) {
                                $scope.success = response.data.message;
                                $scope.error = "";
                                setTimeout(function () {
                                    $scope.success = "";
                                    $scope.error = "";
                                    if (!$scope.$$phase) $scope.$apply();
                                    $state.go('login');
                                }, 2000);
                                $scope.isProcessing = false;

                                $scope.signupForm.$setPristine();
                                $scope.signupForm.$setUntouched();
                                $scope.signupModel = angular.copy(signupModel);

                                if (!$scope.$$phase) $scope.$apply();

                                var analyticsData = {};
                                analyticsData.userData = $scope.signupModel;
                                analyticsData.actionTime = new Date();
                                var analyticsDataString = JSON.stringify(analyticsData);
                                var currentDateTime = $filter("date")(
                                    new Date(),
                                    "MM/dd/yyyy hh:m:ss a"
                                );
                                $rootScope.storeAnalytics(
                                    "UserSignup",
                                    "User Signup" + currentDateTime,
                                    analyticsDataString,
                                    0,
                                    true
                                );
                            } else {
                                $scope.success = "";
                                $scope.error = response.data.message;
                                $scope.isProcessing = false;
                                setTimeout(function () {
                                    $scope.error = "";
                                    if (!$scope.$$phase) $scope.$apply();
                                }, 2000);
                                var analyticsData = {};
                                analyticsData.userData = $scope.resetPasswordModel;
                                analyticsData.actionTime = new Date();
                                analyticsData.errorData = response.data;
                                var analyticsDataString = JSON.stringify(analyticsData);
                                var currentDateTime = $filter("date")(
                                    new Date(),
                                    "MM/dd/yyyy hh:m:ss a"
                                );
                                $rootScope.storeAnalytics(
                                    "Error - UserSignup",
                                    "Error on UserSignup with Poolagency - " +
                                    $scope.error +
                                    " - " +
                                    currentDateTime,
                                    analyticsDataString,
                                    0,
                                    true
                                );
                            }
                        },
                        function (error) {
                            var msg = "Unable to process.";
                            if (
                                typeof error == "object" &&
                                error.data &&
                                error.data.message
                            ) {
                                msg = error.data.message;
                            } else {
                                msg = error;
                            }
                            $scope.success = "";
                            $scope.error = msg;
                            $scope.isProcessing = false;
                            setTimeout(function () {
                                $scope.error = "";
                                if (!$scope.$$phase) $scope.$apply();
                                if (msg == "Invalid access") {
                                    $state.go('login');
                                }
                            }, 2000);
                            var analyticsData = {};
                            analyticsData.userData = $scope.forgotModel;
                            analyticsData.actionTime = new Date();
                            analyticsData.errorData = error;
                            var analyticsDataString = JSON.stringify(analyticsData);
                            var currentDateTime = $filter("date")(
                                new Date(),
                                "MM/dd/yyyy hh:m:ss a"
                            );
                            $rootScope.storeAnalytics(
                                "Error - ResetPassword",
                                "Error on ResetPassword with Poolagency - " +
                                msg +
                                " - " +
                                currentDateTime,
                                analyticsDataString,
                                0,
                                true
                            );

                        }
                    );
                }
            };
            $scope.user = {};
            $scope.user.log = closeModal;

            function closeModal() {
                $cope.test = "aaa";
            }
        }
    ]).controller("resetPasswordController", [
        "$scope",
        "$rootScope",
        "$state",
        "auth",
        "apiGateWay",
        "$filter",
        "ngDialog",
        "config",
        "$location",
        function (
            $scope,
            $rootScope,
            $state,
            auth,
            apiGateWay,
            $filter,
            ngDialog,
            config,
            $location
        ) {
            var t = $location.search()["t"];
            $scope.isProcessing = false;
            if (!t) {
                $state.go("login");
            } else {
                $scope.isProcessing = true;
                apiGateWay
                    .get("/check_reset_token", {
                        code: t
                    })
                    .then(function (response) {
                        if (response.status != 200) {

                            $scope.error = "Your link has expired";

                            setTimeout(function () {
                                $state.go("login");
                            }, 500);

                        }
                        $scope.isProcessing = false;
                    }, function (err) {

                        $scope.error = "Your link has expired";
                        setTimeout(function () {
                            $state.go("login");
                        }, 500);
                        $scope.isProcessing = false;
                    });
            }

            $scope.success = "";
            $scope.error = "";
            //scope login function to perform super admin login

            //openCheckCompanyCreateModal();

            var resetPasswordModel = {
                password: "",
                cpassword: "",
                code: ""
            };
            $scope.resetPasswordModel = angular.copy(resetPasswordModel);
            $scope.doReset = function () {
                if ($scope.resetPasswordForm.$valid) {
                    $scope.isProcessing = true;
                    $scope.resetPasswordModel['code'] = t;
                    apiGateWay.send("/resetPassword", $scope.resetPasswordModel).then(
                        function (response) {
                            if (response.data.status == 201) {
                                $scope.success = response.data.message;
                                $scope.error = "";
                                setTimeout(function () {
                                    $scope.success = "";
                                    $scope.error = "";
                                    if (!$scope.$$phase) $scope.$apply();
                                    $state.go('login');
                                }, 2000);
                                $scope.isProcessing = false;

                                $scope.resetPasswordForm.$setPristine();
                                $scope.resetPasswordForm.$setUntouched();
                                $scope.resetPasswordModel = angular.copy(resetPasswordModel);

                                if (!$scope.$$phase) $scope.$apply();

                                var analyticsData = {};
                                analyticsData.userData = $scope.resetPasswordModel;
                                analyticsData.actionTime = new Date();
                                var analyticsDataString = JSON.stringify(analyticsData);
                                var currentDateTime = $filter("date")(
                                    new Date(),
                                    "MM/dd/yyyy hh:m:ss a"
                                );
                                $rootScope.storeAnalytics(
                                    "ResetPassword",
                                    "Reset Password" + currentDateTime,
                                    analyticsDataString,
                                    0,
                                    true
                                );
                            } else {
                                $scope.success = "";
                                $scope.error = response.data.message;
                                $scope.isProcessing = false;
                                setTimeout(function () {
                                    $scope.error = "";
                                    if (!$scope.$$phase) $scope.$apply();
                                }, 2000);
                                var analyticsData = {};
                                analyticsData.userData = $scope.resetPasswordModel;
                                analyticsData.actionTime = new Date();
                                analyticsData.errorData = response.data;
                                var analyticsDataString = JSON.stringify(analyticsData);
                                var currentDateTime = $filter("date")(
                                    new Date(),
                                    "MM/dd/yyyy hh:m:ss a"
                                );
                                $rootScope.storeAnalytics(
                                    "Error - ResetPassword",
                                    "Error on ResetPassword with Poolagency - " +
                                    $scope.error +
                                    " - " +
                                    currentDateTime,
                                    analyticsDataString,
                                    0,
                                    true
                                );
                            }
                        },
                        function (error) {
                            var msg = "Unable to process.";
                            if (
                                typeof error == "object" &&
                                error.data &&
                                error.data.message
                            ) {
                                msg = error.data.message;
                            } else {
                                msg = error;
                            }
                            $scope.success = "";
                            $scope.error = msg;
                            $scope.isProcessing = false;
                            setTimeout(function () {
                                $scope.error = "";
                                if (!$scope.$$phase) $scope.$apply();
                                if (msg == "Invalid access") {
                                    $state.go('login');
                                }
                            }, 2000);
                            var analyticsData = {};
                            analyticsData.userData = $scope.forgotModel;
                            analyticsData.actionTime = new Date();
                            analyticsData.errorData = error;
                            var analyticsDataString = JSON.stringify(analyticsData);
                            var currentDateTime = $filter("date")(
                                new Date(),
                                "MM/dd/yyyy hh:m:ss a"
                            );
                            $rootScope.storeAnalytics(
                                "Error - ResetPassword",
                                "Error on ResetPassword with Poolagency - " +
                                msg +
                                " - " +
                                currentDateTime,
                                analyticsDataString,
                                0,
                                true
                            );

                        }
                    );
                }
            };
            $scope.user = {};
            $scope.user.log = closeModal;

            function closeModal() {
                $cope.test = "aaa";
            }
        }
    ]);
;
