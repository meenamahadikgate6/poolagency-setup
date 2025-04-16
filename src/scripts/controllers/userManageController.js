angular.module('POOLAGENCY')

.controller('userManageController', function($scope, $rootScope, $filter, $sce, apiGateWay, service,auth,ngDialog, Analytics, $timeout) {

    var initModel = {
        email: '',
        firstName: '',
        lastName:'',
        password:'',
        phoneNumber:'',
        profileImage:'',
        role:'cleaningtech',
        userId:'',
        removeProfilePic: false,
        editAlertPermission: false,
        canEditReadings:false,
        canDeleteJobs:false,
        viewTechnicianPay: false,
        canCreateInvoice: false,
        canEditInvoice: false,
        canDeleteInvoice: false,
        canCreateProducts: false,
        canEditProducts: false,
        canDeleteProducts: false,
        canViewRouteProfitReport: false,
        canDeleteNotes: false,
        canViewCommission: false,
        canEditCommission: false,
        canDismissAlerts: false,
        canBulkDismissAlerts: false,
        canExportCustomerReports: false,
        canExportJobReports: false,
        canExportQuoteReports: false,
        canExportInvoiceReports: false,
        canExportPaymentReports: false,
        canAccessMultiCompany: false,
        canManageAutomaticEmailSettings: false,
        canManageEmailTemplates: false,
        canAccessTrucksAndToolsURL: false,
        canAccessInventoryURL: false,
      }
      $scope.loggedInuserId = "";
      if (auth.getSession()) {
        if (auth.getSession().id) {
            $scope.loggedInuserId = auth.getSession().id;
        }
        if (auth.getSession().status) {
          $scope.loggedInCompanyStatus = auth.getSession().companyStatus;
        }
      }
    $scope.model = angular.copy(initModel);
    $scope.roleValue = {"companyadmin":"Admin","companymanager":"Admin","servicemanager":"Manager","viewer":"Staff"};
    $scope.roles = [];
    $scope.currentPage = 1;
    $scope.limit = 10;
    $scope.myCroppedImage = '';
    $scope.cropperType= "circle";
    $scope.currentFilterValue = 'Active';
    //to get meid list
    $scope.getRoleList = function() {
        $scope.isProcessing = true;
        apiGateWay.get("/roles").then(function(response) {
            if (response.data.status == 200) {
                responseData = response.data;
                $scope.roles = responseData.data;
            } else {
            }
            $scope.isProcessing = false;
        }, function(error) {
        });
    };

    $scope.responseData = '';
    var getCompanyDevices = function(){
        apiGateWay.get("/company/devices").then(function(response) {
            if (response.data.status == 200) {
                $scope.responseData = response.data
            } else {

            }
        }, function(error) {
        });
    }
    getCompanyDevices();

    $scope.getRoleList();
    $scope.closeModal = function(){
        ngDialog.close();
    }



    $scope.toggleCanAccessMultiCompany = function() {
      $scope.model.canAccessMultiCompany = !$scope.model.canAccessMultiCompany;
      $scope.modelForCanAccessMultiCompany.canAccessMultiCompany = !$scope.modelForCanAccessMultiCompany.canAccessMultiCompany;
    }

    $scope.addOrUpdateUser = function(){
        $scope.resetProcess();
        $scope.isProcessing = true;
        $scope.success = false;
        $scope.errorArr = false;
        addUpdateUser();
    }
    /*$scope.$watch('model.role', function (newVal, oldVal) {   
          if(newVal=='companyadmin' || newVal=='companymanager' ){
            $scope.model.editAlertPermission = true;
            $scope.model.canEditReadings = true;
            $scope.model.viewTechnicianPay = true;
          } 
    
    }, true);*/
    var addUpdateUser = function(){
        $scope.model.userImage = $scope.profileImage;        
        $scope.isProcessing = true;
        apiGateWay.send("/company/manage_users", $scope.model).then(function(response) {
            var responseData = response.data;
            var message = responseData && responseData.message ? responseData.message : '';
            if (responseData.status == 201) {
              if($scope.model.userId==$scope.loggedInuserId){
                var userData = response.data.data;
                var session = auth.getSession();
                session['firstName'] = userData['firstName'];
                session['lastName'] = userData['lastName'];
                session['contactNumber'] = userData['contactNumber'];
                session['userImage'] = userData['userImage'];
                auth.setSession(session);
                $rootScope.userSession = session;
              }
              $scope.success = message;
              $scope.closeModal();
              $scope.getUsersList();
              updateManagers();
            }else{
              if($scope.confirmationPopup){
                $scope.confirmationPopup.close();
              }
              $scope.errorArr = message;
            }
            $scope.resetProcess();
            $scope.isProcessing = false;
        },function(errorResponse){
          if($scope.confirmationPopup){
            $scope.confirmationPopup.close();
          }
            $scope.errorArr = errorResponse;
            $scope.resetProcess();
            $scope.isProcessing = false;
        });
    }

      $scope.resetProcess = function(){
        setTimeout(function(){
          $scope.successMsg2 = false;
          $scope.success = false;
          $scope.error = false;
          $scope.errorArr = "";
        }, 2000);
      }

    //to get user list
    $scope.getUsersList = function() {
        $scope.isProcessing = true;
        apiGateWay.get("/company/manage_users", {
            offset: $scope.currentPage - 1,
            limit: $scope.limit,
            userNameORAddress: $scope.userNameORAddress,
            status: $scope.currentFilterValue,
        }).then(function(response) {
            if (response.data.status == 200) {
                var userListResponse = response.data.data;
                $scope.totalRecord = userListResponse.rows;
                $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
                $scope.userList = userListResponse.data;
            } else {
                $scope.userList = [];
            }
            $scope.isProcessing = false;
        }, function(error) {
            var analyticsData = {};
            analyticsData.requestData = {
                offset: $scope.currentPage - 1,
                limit: $scope.limit,
                userNameORAddress: $scope.userNameORAddress
            };
            analyticsData.userData = $rootScope.userSession;
            analyticsData.actionTime = new Date();
            analyticsData.errorData = error;
            var analyticsDataString = JSON.stringify(analyticsData);
            var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
            $rootScope.storeAnalytics('Error - Get user List', "Error on getUsersList - " + currentDateTime, analyticsDataString, 0, true);
        });
    };
    $scope.filterBy = function(filterValue) {
      if($scope.currentFilterValue!=filterValue){
          $scope.currentFilterValue = filterValue;
          $scope.currentPage = 1;
          $scope.getUsersList()
      }
    };
    $scope.changePage = function(page){
      $scope.currentPage = page;
      $scope.getUsersList();
    }

    $scope.getNumberToArray = function(num) {
        return new Array(num);
    };

    $scope.removeProfilePicture = function(){
      $scope.profileImage = '';
      $scope.model.profileImage = '';
      if (!$scope.$$phase) $scope.$apply()
    }

    $scope.browseImage = function() {
      document.getElementById('profileImage').value = '';
        document.getElementById('profileImage').click();
    };
    $scope.profileImage = '';

    $scope.uploadFile = function() {
        var imageData = $scope.model.profileImage;
        if(imageData.filename){
          if(["image/gif", "image/png", "image/jpeg"].indexOf(imageData.filetype) != -1){
            $scope.myimage = 'data:image/png;base64,' + imageData.base64;

            //added image cropper popup
            ngDialog.open({
                template: 'templates/crop-image.html?ver=' + $rootScope.PB_WEB_VERSION,
                className: 'ngdialog-theme-default',
                closeByDocument: false,
                scope: $scope,
                preCloseCallback: function (data) {
                    //if (!(data == 'close' && data == '$closeButton')) {
                        if (data != 'close') {
                            $scope.profileImage = data;

                        }else{
                            $scope.myimage ="";
                        }
                }
            });
          }else{
              $scope.profileImage = "";
              $scope.myimage ="";
              $scope.errorArr = "Please select image format in JPEG PNG and GIF.";
              $scope.resetProcess();
          }
        }
        if (!$scope.$$phase) $scope.$apply()
    };


    $scope.addCompany = function(action, data, index){
      if (action == 'Add' && $rootScope.userSession && $rootScope.userSession.isCompanyHasFullSignUp == false) {
          $scope.error = 'Company is not subscribed yet. Please complete the subscription to add a new user.';
          $timeout(function(){
            $scope.error = '';
          }, 3000)
          return false
        }
        data = data || {};

        $scope.model = angular.copy(initModel);
        $scope.success = false;
        $scope.errorArr = false;
        $scope.profileImage = '';

        $scope.index = index;
        $scope.model.actionType = 'add';
        $scope.action = action;
        if(data){
          $scope.model = {
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              password:'',
              phoneNumber: data.contactNumber,
              profileImage:data.userImage,
              role: data.userRolesKey,
              userId: data.id,
              actionType: action.toLowerCase(),
              editAlertPermission: data.editAlertPermission ? true : false,
              canEditReadings: data.canEditReadings ? true : false,
              canDeleteJobs: data.canDeleteJobs ? true : false,
              canCreateInvoice: data.canCreateInvoice ? true : false,
              canEditInvoice: data.canEditInvoice ? true : false,
              canDeleteInvoice: data.canDeleteInvoice ? true : false,
              viewTechnicianPay: data.viewTechnicianPay ? true : false,
              canCreateProducts: data.canCreateProducts ? true : false,
              canEditProducts: data.canEditProducts ? true : false,
              canDeleteProducts: data.canDeleteProducts ? true : false,
              canViewRouteProfitReport: data.canViewRouteProfitReport ? true : false,
              canDeleteNotes: data.canDeleteNotes ? true : false,
              canViewCommission: data.canViewCommission ? true : false,
              canEditCommission: data.canEditCommission ? true : false,
              canDismissAlerts: data.canDismissAlerts ? true : false,
              canBulkDismissAlerts: data.canBulkDismissAlerts ? true : false,
              canExportCustomerReports: data.canExportCustomerReports ? true : false,
              canExportJobReports: data.canExportJobReports ? true : false,
              canExportQuoteReports: data.canExportQuoteReports ? true : false,
              canExportInvoiceReports: data.canExportInvoiceReports ? true : false,
              canExportPaymentReports: data.canExportPaymentReports ? true : false,
              canAccessMultiCompany: data.canAccessMultiCompany ? true : false,
              canManageAutomaticEmailSettings: data.canManageAutomaticEmailSettings ? true : false,
              canManageEmailTemplates: data.canManageEmailTemplates ? true : false,
              canAccessTrucksAndToolsURL: data.canAccessTrucksAndToolsURL ? true : false,
              canAccessInventoryURL: data.canAccessInventoryURL ? true : false            
          }
        }
        $scope.profileImage = data.userImage;



        ngDialog.open({
            template: 'templates/company/userformfields.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default',
            scope: $scope,
            closeByDocument: false,
            preCloseCallback: function() {

            }
        });
    }

    $scope.editUser = function(userObj, index){
      $scope.addCompany('edit', userObj, index)
    }

    $scope.setStatus = function(userId, status, index){
      var model = {"isActive": status ? 0 : 1, "userId": userId}
      $scope.isProcessing = true;
      apiGateWay.send("/company/user_status", model).then(function(response) {
          var responseData = response.data;
          var message = responseData && responseData.message ? responseData.message : '';
          if (responseData.status == 201) {
            $scope.success = message;
            $scope.closeModal();
            $scope.userList[index].isActive = model.isActive;
          }else{
            $scope.errorArr = message;
             $scope.error3 = message;
          }
          updateManagers();
          $scope.resetProcess();
          $scope.getUsersList();
          $scope.isProcessing = false;
      },function(errorResponse){
          $scope.errorArr = errorResponse;
          $scope.error3 = errorResponse;
          $scope.resetProcess();
          $scope.isProcessing = false;
      });
      setTimeout(function() {
        $scope.error3 = '';
      }, 2000);
    }

    var updateManagers = function(){
      $rootScope.socket.emit("refreshManagerList",function(data) {
      });
    }


  $scope.addUserConfirm = function(routeId){         
     
   $scope.confirmationPopup = ngDialog.open({            
        id  : 11,
        template: 'addUserConfirm.html',
        className: 'ngdialog-theme-default v-center',
        overlay: true,
        closeByNavigation: true,
        scope: $scope,
        preCloseCallback: function () {
       
        }
    });
  }
  $scope.changeRole = function(role){   
   
    if(role == 'companymanager'){
      $scope.model.editAlertPermission = true;
      $scope.model.canEditReadings = true;
      $scope.model.canDeleteJobs = true;
      $scope.model.canCreateInvoice= true;
      $scope.model.canEditInvoice= true;
      $scope.model.canDeleteInvoice= true;
      $scope.model.viewTechnicianPay = true;
      $scope.model.canCreateProducts = true;
      $scope.model.canEditProducts = true;
      $scope.model.canDeleteProducts = true;
      $scope.model.canViewRouteProfitReport = true;
      $scope.model.canDeleteNotes = true;
      $scope.model.canViewCommission = true;
      $scope.model.canEditCommission = true;
      $scope.model.canDismissAlerts = true;
      $scope.model.canBulkDismissAlerts = true;
      $scope.model.canExportCustomerReports = true;
      $scope.model.canExportJobReports = true;
      $scope.model.canExportQuoteReports = true;
      $scope.model.canExportInvoiceReports = true;
      $scope.model.canExportPaymentReports = true;
      $scope.model.canAccessMultiCompany = false;
      $scope.model.canManageAutomaticEmailSettings = true;
      $scope.model.canManageEmailTemplates = true;
      $scope.model.canAccessTrucksAndToolsURL = true;
      $scope.model.canAccessInventoryURL = true;
    } else if(role == 'servicemanager'){
      $scope.model.editAlertPermission = false;
      $scope.model.canDeleteJobs = false;
      $scope.model.canEditReadings = true;
      $scope.model.canCreateInvoice= false;
      $scope.model.canEditInvoice= false;
      $scope.model.canDeleteInvoice= false;
      $scope.model.viewTechnicianPay = true;
      $scope.model.canCreateProducts = false;
      $scope.model.canEditProducts = false;
      $scope.model.canDeleteProducts = false;
      $scope.model.canViewRouteProfitReport = false;
      $scope.model.canDeleteNotes = false;
      $scope.model.canViewCommission = false;
      $scope.model.canEditCommission = false;
      $scope.model.canDismissAlerts = false;
      $scope.model.canBulkDismissAlerts = false;
      $scope.model.canExportCustomerReports = true;
      $scope.model.canExportJobReports = true;
      $scope.model.canExportQuoteReports = true;
      $scope.model.canExportInvoiceReports = true;
      $scope.model.canExportPaymentReports = true;
      $scope.model.canAccessMultiCompany = false;
      $scope.model.canManageAutomaticEmailSettings = false;
      $scope.model.canManageEmailTemplates = false;
      $scope.model.canAccessTrucksAndToolsURL = false;
      $scope.model.canAccessInventoryURL = false;
    } else {
      $scope.model.canDeleteJobs = false;
      $scope.model.editAlertPermission = false;
      $scope.model.canEditReadings = false;
      $scope.model.viewTechnicianPay = false;
      $scope.model.canCreateInvoice= false;
      $scope.model.canEditInvoice= false;
      $scope.model.canDeleteInvoice= false;
      $scope.model.canCreateProducts = false;
      $scope.model.canEditProducts = false;
      $scope.model.canDeleteProducts = false;
      $scope.model.canViewRouteProfitReport = false;
      $scope.model.canDeleteNotes = false;
      $scope.model.canViewCommission = false;
      $scope.model.canEditCommission = false;
      $scope.model.canDismissAlerts = false;
      $scope.model.canBulkDismissAlerts = false;
      $scope.model.canExportCustomerReports = true;
      $scope.model.canExportJobReports = true;
      $scope.model.canExportQuoteReports = true;
      $scope.model.canExportInvoiceReports = true;
      $scope.model.canExportPaymentReports = true;
      $scope.model.canAccessMultiCompany = false;
      $scope.model.canManageAutomaticEmailSettings = false;
      $scope.model.canManageEmailTemplates = false;
      $scope.model.canAccessTrucksAndToolsURL = false;
      $scope.model.canAccessInventoryURL = false;
    }

  }

});
