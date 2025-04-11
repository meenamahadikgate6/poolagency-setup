angular
.module("POOLAGENCY")
.controller("technicianController", function($scope, $rootScope, $filter, $sce, apiGateWay, service, ngDialog, Analytics, $timeout) {  
    $scope.isCompanyActive = 1;
    $scope.pmModel = {
      techId: 0,
      canSeeCustDetails : 0,
      accessForProducts : 0,
      canCreateProductsServiceInApp : 0,
      canEditOnTheWayTextMessage: 0,
      showCaptionInCustomerEmail: 0,
      canCreateCustomerNotesInApp: 0,
      canEditEquipmentItems: 0,
      canCreateJobsInApp: 0,
      canEditJobsInApp: 0,
      canCreateQuotes: 0,
      canCreateRouteStops: 0,
      canAccessCustomerDetails: 0,
      canViewJobHistory: 0,
      canViewQuoteHistory: 0,
      canViewInvoiceHistory: 0,
      canViewPaymentHistory: 0,
      canEditGateCodes: 0,
      canEditPropertyAccessInstructions: 0,
      canEditDogInfo: 0,
      canSendJobEmailsToCustomers : 0,
      canSeePricesAmounts: 0,
      canCreateInvoiceInApp: 0,
      canEditInvoiceInApp: 0,
      canSendInvoiceEmailsToCustomers: 0,
    };
    $scope.checkCompanyStatus = function(){
      if($rootScope.adminCompanyList && $rootScope.adminCompanyList.length > 0){
        $rootScope.adminCompanyList.filter(function(item, index){
          if(item.companyId == $rootScope.selectedCompany){
            $scope.isCompanyActive = item.status;         
          }       
          
        });
      }  
    } 
   
    $scope.$watch('userSession', function (newVal, oldVal) {   
      if($rootScope.userSession){
        $scope.isCompanyActive = $rootScope.userSession.companyStatus
      }
              
    }, true);
    $scope.$watch('adminCompanyList', function (newVal, oldVal) {    
      if(newVal){
        $scope.checkCompanyStatus();
      }            
    }, true);
    $scope.currentPageMeid = $scope.currentPage = 1;
    $scope.showingFrom = 1;
    $scope.limit = 10;
    $scope.userName = "";
    $scope.address = "";
    $scope.isProcessing = false;
    $scope.image = [];
    $scope.imageedit = [];
    $scope.techForm = [];
    $scope.techEditForm = [];
    $scope.successMsg = "";
    $scope.errorArr = [];
    $scope.techEditModel = [];
    $scope.techModel = [];
    $scope.currentFilterValue = 'Active';
    $scope.myCroppedImage = '';
    $scope.cropperType= "circle";
    $scope.techModel2 = {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      userTypes: {
        cleaningtech: true,
        installer: false
      },
      userImage: ""
    };
    $scope.techRoles  = {"cleaningtech":"Cleaning Tech","installer":"Installer"};


    $scope.techWithoutMeid = [];
    var getWithOutMeidTechnician = function(){
      apiGateWay.get("/technician_without_meid", {}).then(function(response) {
          if(response.status==200){
              $scope.techWithoutMeid = response.data.data;
          }
      });
    }

    getWithOutMeidTechnician();

    $scope.assignMeidToTech = function(techUserId, meid){
      $scope.isProcessing = true;
      $scope.error3 = '';
      $scope.successMsg = '';
      apiGateWay.send("/assign_meid_tech", {techUserId: techUserId, meid: meid}).then(function(response) {
          if(response.status==200){
              $scope.getMeidList();
              $scope.successMsg = response.data.message;
              getWithOutMeidTechnician();
              $scope.selectedIndex = -1;
              setTimeout(function() {
                $scope.successMsg = "";
              }, 2000);
          }else{
            $scope.error3 = response.data.message;
            setTimeout(function() {
              $scope.error3 = "";
            }, 2000);
          }
          $scope.isProcessing = false;
      },function(error) {
          var msg = "Error";
          if (typeof error == "object" && error.data && error.data.message) {
            msg = error.data.message;
          } else {
            msg = error;
          }
          $scope.error3 = msg;
          setTimeout(function() {
            $scope.error3 = "";
          }, 2000);
      });
    }

    $scope.deleteMeid = function(meidId){
          apiGateWay.send("/delete_meid", {meidId: meidId}).then(function(response) {
              if(response.status==200){
                  $scope.getMeidList();
                  $scope.successMsg = response.data.message;
                  $scope.selectedIndex = -1;
                  setTimeout(function() {
                    $scope.successMsg = "";
                    if (!$scope.$$phase) $scope.$apply();
                  }, 2000);
              }else{
                $scope.error3 = response.data.message;
                setTimeout(function() {
                  $scope.error3 = "";
                }, 2000);
              }
              $scope.isProcessing = false;
          },function(error) {
              var msg = "Error";
              if (typeof error == "object" && error.data && error.data.message) {
                msg = error.data.message;
              } else {
                msg = error;
              }
              $scope.error3 = msg;
              setTimeout(function() {
                $scope.error3 = "";
              }, 2000);
          });
    }

    //to get meid list
    $scope.getMeidList = function() {
      /* $scope.isProcessing = true;

      apiGateWay.get("/meid", {offset: $scope.currentPage - 1,limit: $scope.limit,userNameORAddress: $scope.userNameORAddress}).then(function(response) {
            $scope.meidList = [];
            if (response.data.status == 200) {
              var meidListResponse = response.data.data;
              $scope.totalRecordMeid = meidListResponse.rows;
              $scope.totalPageMeid =
                $scope.totalRecordMeid % $scope.limit !== 0 ? parseInt($scope.totalRecordMeid / $scope.limit) : parseInt($scope.totalRecordMeid / $scope.limit) - 1;
                  setTimeout(function(){
                      $scope.meidList = meidListResponse;
                      if (!$scope.$$phase) $scope.$apply();
                      $scope.isProcessing = false;
                  }, 0);

              angular.forEach(meidListResponse,function(value,key){
                $scope.techModel[key]= {};
                $scope.techModel[key].phoneNumber = '';
              });
            } else {
              $scope.meidList = [];
              $scope.isProcessing = false;
              $scope.meidList.push(defaultMeid);
            }
          },function(error) {
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
            var currentDateTime = $filter("date")(new Date(),"MM/dd/yyyy hh:m:ss a");
            $rootScope.storeAnalytics("Error - Get Meid List","Error on getMeidList - " + currentDateTime,analyticsDataString,0,true);

          }
        ); */
    };


    var companySelectedEventListener = $rootScope.$on("companySelected", function(data) {
        $scope.currentPage = 1;
        $scope.showingFrom = 1;
        $scope.getMeidList();
        $scope.getDeviceList();
        $scope.getTechnicianList();
        $scope.showInvite = false;
    });
    $scope.$on('$destroy', function() {
      companySelectedEventListener();
    });

    //to get technician list
    $scope.getTechnicianList = function() {
      $scope.checkCompanyStatus();
      $scope.isProcessing = true;
      var paramObj = {status: $scope.currentFilterValue, offset: $scope.currentPage - 1,limit: $scope.limit,userNameORAddress: $scope.userNameORAddress};
      apiGateWay.get("/technicians", paramObj).then(function(response) {
            if (response.data.status == 200) {
              $scope.parseTechListData(response.data.data)              
            } else {
              $scope.technicianList = [];
            }
            $scope.showEditField = [];
            $scope.isProcessing = false;
          },
          function(error) {

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
            var currentDateTime = $filter("date")(
              new Date(),
              "MM/dd/yyyy hh:m:ss a"
            );
            $rootScope.storeAnalytics(
              "Error - Get Technician List",
              "Error on getTechnicianList - " + currentDateTime,
              analyticsDataString,
              0,
              true
            );
          }
        );
    };
    $scope.parseTechListData = (_data) => {
      var technicianListResponse = _data;
      $scope.totalRecord = technicianListResponse.rows;
      $scope.totalPage =
        $scope.totalRecord % $scope.limit !== 0
          ? parseInt($scope.totalRecord / $scope.limit)
          : parseInt($scope.totalRecord / $scope.limit) - 1;
      $scope.technicianList = technicianListResponse.data;
    }


    $scope.techRating = {};
    $scope.parseTechRating = function(techId, ratingObj){
        if(typeof $scope.techRating[techId] == 'undefined'){
            $scope.techRating[techId] = {up:0, down: 0}
        }
        if(ratingObj && ratingObj.length > 0){
          var dataObj = {};
          dataObj[ratingObj[0]['rating']] = ratingObj[0]['count']

          if(ratingObj.length > 1){
            dataObj[ratingObj[1]['rating']] = ratingObj[1]['count']
          }

          $scope.techRating[techId] = dataObj;
        }
    }


    $scope.getTechnicianList();
    $scope.getNumberToArray = function(num) {
      return new Array(num);
    };
    $scope.selectedIndex = -1;
    $scope.expandMEID = function(index) {
      if ($scope.selectedIndex == index) {
        $scope.selectedIndex = -1;
      } else {
        $scope.selectedIndex = index;
      }
    };
    //for pagination
    $scope.goToTechnicianPage = function(page) {
      $scope.currentPage = page;
      $scope.showingFrom = page* $scope.limit - ($scope.limit-1);
      $scope.getTechnicianList();
    };

    //to show address list on dialog
    $scope.showAddressList = function(addressList, selectedTechnicianId) {
      ngDialog.open({
        template: "addressList.html",
        className: "ngdialog-theme-default",
        scope: $scope,
        preCloseCallback: function() {
          /* Do something here*/
          $scope.selectedTechnicianId = 0;
          $scope.addressListOnModel = {};
        }
      });
      $scope.addressListOnModel = addressList;
      $scope.selectedTechnicianId = selectedTechnicianId;
    };

    //to search technician by entered name
    $scope.doSearchTechnicianList = function($event) {
      //if ($event.target.value || $scope.technicianList.length ==0) {
      $scope.userNameORAddress = $event.target.value.trim().replace(/,/g, "");
      $scope.getTechnicianList();
      //}
    };

    //make input file clicked
    $scope.browseImage = function(i, type) {
      type = type ? type : "";
      document.getElementById("image" + type + i).value = '';
      document.getElementById("image" + type + i).click();
    };
    $scope.imgdata = [];
    $scope.uploadFile = function(i) {
      $scope.errorArr = [];
      var imageData = $scope.image[i];
      if(imageData.filename){
        if(["image/gif", "image/png", "image/jpeg"].indexOf(imageData.filetype) != -1){
          $scope.myimage = "data:image/png;base64," + imageData.base64;
          //Added image croppper popup
          ngDialog.open({
           template: 'templates/crop-image.html?ver=' + $rootScope.PB_WEB_VERSION,
           className: 'ngdialog-theme-default',
           closeByDocument: false,
           scope: $scope,
           preCloseCallback: function (data) {
               //if (!(data == 'close' && data == '$closeButton')) {
                   if (data != 'close') {
                       $scope.myimage = $scope.imgdata[i] = data;

                   }else{
                       $scope.myimage ="";
                   }
           }
         });
        }else{
            $scope.imgdata[i] = "";
            $scope.errorArr[i] = "Please select image format in JPEG PNG and GIF.";
            $scope.resetProcess();
        }
      }
    };

    $scope.imgdataedit = [];
    $scope.showEditField = [];
    $scope.uploadFileEdit = function(i) {
      $scope.errorArr = [];
      var imageData = $scope.imageedit[i];
      if(imageData.filename){
        if(["image/gif", "image/png", "image/jpeg"].indexOf(imageData.filetype) != -1){
          $scope.myimage = "data:image/png;base64," + imageData.base64;
               //Added image croppper popup
               ngDialog.open({
                template: 'templates/crop-image.html?ver=' + $rootScope.PB_WEB_VERSION,
                className: 'ngdialog-theme-default',
                closeByDocument: false,
                scope: $scope,
                preCloseCallback: function (data) {
                    //if (!(data == 'close' && data == '$closeButton')) {
                        if (data != 'close') {
                            $scope.myimage = $scope.imgdataedit[i] = data;

                        }else{
                            $scope.myimage ="";
                        }
                }
            });


        }else{
            $scope.imgdataedit[i] = "";
            $scope.myimage ="";
            $scope.errorArr[i] = "Please select image format in JPEG PNG and GIF.";
            $scope.resetProcess();
        }
      }

    };
    var tModel = $scope.techModel2;


    $scope.addEditTechnician = function(i, meid, techModel){
      if ($scope.techForm[i].$valid) {

        addEditTechnician(i, meid, techModel);
       /*  $scope.resetProcess();
        $scope.isProcessing = true;
        $scope.success = [];
        $scope.errorArr = []; */

        /* apiGateWay.send("/check_company_subscription", {}).then(function(response) {
            if (response.data.status == 200) {
                var responseData = response.data.data;
                if(!responseData.paymentStatus){
                    var amount = responseData.amount;
                    var message = responseData.message;
                    $scope.confirmAlert({i: i, meid: meid, techModel: techModel, message: message}, 'addtech');
                    // if(confirm(message)){
                    //       addEditTechnician(i, meid, techModel);
                    // }else{
                    //     $scope.isProcessing = false;
                    // }
                    $scope.isProcessing = false;
                }else{
                  addEditTechnician(i, meid, techModel);
                }
            }else{
              $scope.isProcessing = false;
            }
        }); */
      }
    }

    $scope.resetProcess = function(){
      setTimeout(function(){
        $scope.success = false;
        $scope.error = false;
        $scope.successMsg3 = false;
        $scope.successMsg = false;
        $scope.error3 = false;
        $scope.errorArr = [];
        if (!$scope.$$phase) $scope.$apply();
      }, 5000);
      $scope.isProcessing = false;
      $scope.isProcessingDevice = false;
    }



    //to save technicin data by api
    var addEditTechnician = function(i, meid, techModel) {
        techModel.meid = meid;
        techModel.userImage = $scope.imgdata[i];
        $scope.isProcessing = true;
        var userTypes = techModel.userTypes;
        var uType = [];
        angular.forEach(userTypes, function(k, v) {
          if (k == true) {
            uType.push(v);
          }
        });
        var techModelNew = angular.copy(techModel);
        techModelNew.userTypes = uType;
        var techModelAnal = techModelNew;
        techModelNew['userRolesKey'] = ["cleaningtech"];
        techModelNew['userTypes'] = ["cleaningtech"];
        techModelNew['roles'] = [{"value":"Cleaning Tech","key":"cleaningtech"}];
        apiGateWay.send("/technicians", techModelNew).then(function(response) {
            if (response.data.status == 201) {
              techModel = tModel;
              //angular.element(document.getElementById("meidFormDiv" + i)).remove();
              $scope.successMsg = response.data.message;
              $scope.getTechnicianList();
              $scope.selectedIndex = -1;
              $scope.techModel = [];
              setTimeout(function() {
                $scope.successMsg = "";
                $scope.getMeidList();
                $scope.imgdata[0] = '';
                $scope.closeModal();
                getWithOutMeidTechnician();
                $scope.getDeviceList();
                $scope.isProcessing = false;
              }, 1000);
              $scope.error = "";
              var analyticsData = { userData: $rootScope.userSession, data: techModelAnal, actionTime: new Date()};
              var analyticsDataString = JSON.stringify(analyticsData);
              var currentDateTime = $filter("date")(new Date(), "MM/dd/yyyy hh:m:ss a");
              $rootScope.storeAnalytics("Technician","Add Technician for MEID - " + meid + " - " + currentDateTime,analyticsDataString,0,true);
              $scope.resetProcess();
            } else {
              $scope.successMsg = "";
              $scope.errorArr[i] = response.data.message;
              $scope.errormsg = response.data.message;
              var analyticsData = {};
              $scope.isProcessing = false;
              analyticsData.requestData = techModelAnal;
              analyticsData.userData = $rootScope.userSession;
              analyticsData.actionTime = new Date();
              analyticsData.errorData = response.data;
              var analyticsDataString = JSON.stringify(analyticsData);
              var currentDateTime = $filter("date")(new Date(),"MM/dd/yyyy hh:m:ss a");
              $rootScope.storeAnalytics("Error - Add Edit Technician","Error on addEditTechnician - " + currentDateTime, analyticsDataString,0,true);
              $scope.resetProcess();
            }
            $scope.isProcessing = false;
          },function(error) {
            var msg = "Error";
            if (typeof error == "object" && error.data && error.data.message) {
              msg = error.data.message;
            } else {
              msg = error;
            }
            $scope.errormsg = msg;
            setTimeout(function() {
              $scope.errormsg = "";
            }, 1000);
            
            if(msg.indexOf("duplicate transaction") != -1){
              alert("Payment Declined - Possible duplicate transactions. Please try again in a few minutes or contact your financial institution if the issue persists.");
              //location.reload();
            }
            var analyticsData = {};
            $scope.isProcessing = false;
            analyticsData.requestData = techModelAnal;
            analyticsData.userData = $rootScope.userSession;
            analyticsData.actionTime = new Date();
            analyticsData.errorData = error;
            var analyticsDataString = JSON.stringify(analyticsData);
            var currentDateTime = $filter("date")(
              new Date(),
              "MM/dd/yyyy hh:m:ss a"
            );
            $rootScope.storeAnalytics("Error - Add Edit Technician","Error on addEditTechnician - " + currentDateTime,analyticsDataString,0,true);
            $scope.successMsg = "";
            $scope.errorArr[i] = msg;
            setTimeout(function() {
              $scope.errorArr[i] = "";
              $scope.isProcessing = false;
            }, 5000);
            $scope.resetProcess();
        });
    };

    //to show chemical cost on dialog
    $scope.addTechnicianForm = function(type) {
        ngDialog.closeAll();
        $scope.type = type;
        $scope.addTechModal = ngDialog.open({
            template: 'addTechTemplate.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {
              $scope.type = '';
            }
        });
    };

    $scope.closeTechModal = function(){
      $scope.addTechModal.close();
    }


    $scope.editTechnician = function(i){
        $scope.resetProcess();
        $scope.isProcessing = true;
        $scope.success = [];
        $scope.errorArr = [];
        editTechnician(i)
    }

    var editTechnician = function(i) {
      if ($scope.techEditForm[i].$valid) {
        $scope.techEditModel[i].userImage = angular.copy($scope.imgdataedit[i]);
        $scope.isProcessing = true;
        var userTypes = $scope.techEditModel[i].userTypes;
        // $scope.techModel[i] = techModel;
        var uType = [];
        uValue = [];
        uRoles = []
        angular.forEach(userTypes, function(k, v) {
          if (k == true) {
            uType.push(v);
            uValue.push($scope.techRoles[v]);
            uRoles.push({"key":v,"value":$scope.techRoles[v]});
          }
        });

        var techModelNew = angular.copy($scope.techEditModel[i]);
        // update technician permissions based on model data
        Object.keys($scope.pmModel).forEach(key => {
          if (techModelNew.hasOwnProperty(key)) {
            techModelNew[key] = $scope.pmModel[key];
          }
        });
        techModelNew.userTypes = uType;
        var techModelAnal = techModelNew;
        $scope.successMsg3 = false;
        $scope.error3 = false;
        techModelNew["phoneNumber"] = techModelNew["contactNumber"];
        apiGateWay.send("/technicians", techModelNew).then(function(response) {
            if (response.data.status == 201) {
              $scope.showEditField[i] = false;
                $scope.successMsg3 = "";
                $scope.isProcessing = false;
                $scope.technicianList[i].userRolesKey = ["cleaningtech"];
                $scope.technicianList[i].roles = [{"value":"Cleaning Tech","key":"cleaningtech"}];
                $scope.technicianList[i].userRolesValue = uValue.join(",");
                $scope.technicianList[i].firstName = techModelNew.firstName;
                $scope.technicianList[i].lastName = techModelNew.lastName;
                $scope.technicianList[i].phoneNumber = techModelNew.phoneNumber;
                $scope.technicianList[i].contactNumber = techModelNew.contactNumber;
                $scope.technicianList[i].email = techModelNew.email;
                $scope.technicianList[i].userImage = techModelNew.userImage;
                $scope.successMsg3 = response.data.message;
                $scope.resetProcess();
              if (!$scope.$$phase) $scope.$apply();
              $scope.error3 = false;
              var analyticsData = {};
              analyticsData.userData = $rootScope.userSession;
              analyticsData.data = techModelAnal;
              analyticsData.actionTime = new Date();
              var analyticsDataString = JSON.stringify(analyticsData);
              var currentDateTime = $filter("date")(
                new Date(),
                "MM/dd/yyyy hh:m:ss a"
              );
              $rootScope.storeAnalytics("Technician","Edit Technician - " + currentDateTime,analyticsDataString,0,true);
              $scope.getTechnicianList();
            } else {
              $scope.successMsg = "";
              $scope.error3 = response.data.message;
              var analyticsData = {};
              $scope.isProcessing = false;
              analyticsData.requestData = techModelAnal;
              analyticsData.userData = $rootScope.userSession;
              analyticsData.actionTime = new Date();
              analyticsData.errorData = response.data;
              var analyticsDataString = JSON.stringify(analyticsData);
              var currentDateTime = $filter("date")(
                new Date(),
                "MM/dd/yyyy hh:m:ss a"
              );
              $rootScope.storeAnalytics(
                "Error - Edit Technician",
                "Error on editTechnician - " + currentDateTime,
                analyticsDataString,
                0,
                true
              );
            }
            $scope.isProcessing = false;
          },
          function(error) {
            var msg = "Error";
            if (typeof error == "object" && error.data && error.data.message) {
              msg = error.data.message;
            } else {
              msg = error;
            }
            var analyticsData = {};
            $scope.isProcessing = false;
            analyticsData.requestData = techModelAnal;
            analyticsData.userData = $rootScope.userSession;
            analyticsData.actionTime = new Date();
            analyticsData.errorData = error;
            var analyticsDataString = JSON.stringify(analyticsData);
            var currentDateTime = $filter("date")(
              new Date(),
              "MM/dd/yyyy hh:m:ss a"
            );
            $rootScope.storeAnalytics(
              "Error - Edit Technician",
              "Error on editTechnician - " + currentDateTime,
              analyticsDataString,
              0,
              true
            );
            $scope.successMsg = "";
            $scope.errorArr[i] = msg;
            setTimeout(function() {
              $scope.errorArr[i] = "";
              $scope.isProcessing = false;
            }, 5000);
          }
        );
      }else{
        $scope.isProcessing = false;
      }
    };


    $scope.filterBy = function(filterValue) {
      if($scope.currentFilterValue!=filterValue){
          $scope.currentFilterValue = filterValue;
          $scope.technicianList = [];
          $scope.totalRecord = 0;
          $scope.showingFrom = 1;
          $scope.currentPage = 1;
          $scope.getTechnicianList()
      }
    };


    $scope.showInvite = false;
    $scope.toggleInvite = function() {
      $scope.showInvite = !$scope.showInvite;
    };
    $scope.inviteModel = {
      contactNumber: ""
    };

    //to invite user by submit data
    $scope.invite = function() {
        $scope.isProcessing = true;
        apiGateWay.send("/invite_email", $scope.inviteModel).then(function(response) {
            if (response.data.status == 201) {
                  $scope.isProcessing = false;
                  $scope.successMsg2 = response.data.message;
                  $scope.inviteModel = {};
                  setTimeout(function() { $scope.successMsg2 = false; $scope.closeTechModal(); $scope.toggleInvite(); }, 1000);
                  $scope.error2 = "";
            } else {
                  $scope.successMsg2 = "";
                  $scope.isProcessing = false;
                  $scope.error2 = response.data.message;
                  var analyticsData = {};
                  analyticsData.requestData = $scope.inviteModel;
                  analyticsData.userData = $rootScope.userSession;
                  analyticsData.actionTime = new Date();
                  analyticsData.errorData = response.data;
                  var analyticsDataString = JSON.stringify(analyticsData);
                  var currentDateTime = $filter("date")(new Date(),"MM/dd/yyyy hh:m:ss a");
                  $rootScope.storeAnalytics("Error - Invite","Error on invite - " + currentDateTime,analyticsDataString,0,true);
            }
            $scope.isProcessing = false;
          },function(error) {
              var msg = "Error";
              if (typeof error == "object" && error.data && error.data.message) { msg = error.data.message; } else { msg = error; }
              $scope.successMsg2 = "";
              $scope.error2 = msg;
              setTimeout(function() { $scope.error2 = ""; $scope.isProcessing = false; }, 2000);
              $scope.isProcessing = false;
              var analyticsData = {};
              analyticsData.requestData = $scope.inviteModel;
              analyticsData.userData = $rootScope.userSession;
              analyticsData.actionTime = new Date();
              analyticsData.errorData = error;
              var analyticsDataString = JSON.stringify(analyticsData);
              var currentDateTime = $filter("date")(new Date(),"MM/dd/yyyy hh:m:ss a");$rootScope.storeAnalytics("Error - Invite","Error on invite - " + currentDateTime,analyticsDataString,0,true);
          });
    };

    $scope.freeDeviceList = [];
    $scope.getDeviceList = function(){
      apiGateWay.get("/company/devices", {type: 'all'}).then(function(response) {
          if (response.data.status == '200') {
              responseData = response.data.data;
              $scope.freeDeviceList = responseData.freeDeviceList;
              $scope.deviceListData = responseData;
          }
      });
    }
    $scope.getDeviceList();
    // $scope.deviceListData = {};
    // var getCompanyDevices = function(){
    //     apiGateWay.get("/company/devices", {}).then(function(response) {
    //         if (response.data.status == 200) {
    //             $scope.responseData = response.data
    //             $scope.deviceListData = response.data.data
    //         } else {
    //
    //         }
    //     }, function(error) {
    //     });
    // }
    //getCompanyDevices();

    $scope.changeDevice = function(technicianObj, index){

      $scope.technicianObj = technicianObj;
      $scope.index = index;
        ngDialog.open({
          template: 'templates/company/techchangedevice.html?ver=' + $rootScope.PB_WEB_VERSION,
          className: 'ngdialog-theme-default',
          scope: $scope,
          closeByDocument: false,
          preCloseCallback: function() {
            /* Do something here*/
            $scope.technicianObj = {};
            $scope.index = '';
          }
        });
    }

    $scope.switchDevice = function(deviceObj, technicianObj){
      if(deviceObj && typeof deviceObj == 'string'){
        deviceObj = JSON.parse(deviceObj);
      }
      var model = {
        existingDeviceCompId: technicianObj.mapId,
        newDeviceCompId: deviceObj.deviceCompId,
        deviceTechId: technicianObj.deviceCompId
      };

      $scope.isProcessingDevice = true;
        apiGateWay.send("/company/switch_tech_device", model).then(function(response) {
            var responseData = response.data;
            var message = responseData && responseData.message ? responseData.message : '';
            if (responseData.status == 200) {
              $scope.successMsg = message;
              $scope.closeModal();
              $scope.getDeviceList();
              $scope.getTechnicianList();
            }else{
              $scope.responseData = message;
            }
            $scope.resetProcess();
        },function(errorResponse){
            $scope.errorDevice = errorResponse;
            $scope.resetProcess();
        });
    }

    $scope.closeModal = function(){
      ngDialog.closeAll();
    }


    $scope.showEdit = function(technician, index) {
      if(!$scope.showEditField[index]){
        $scope.techEditModel[index] = angular.copy(technician);
        $scope.pmModel = {
          techId : technician.id,
          canSeeCustDetails :  technician.canSeeCustDetails,
          accessForProducts : technician.accessForProducts,
          canCreateProductsServiceInApp : technician.canCreateProductsServiceInApp,
          canEditOnTheWayTextMessage: technician.canEditOnTheWayTextMessage,
          showCaptionInCustomerEmail: technician.showCaptionInCustomerEmail,
          canCreateCustomerNotesInApp: technician.canCreateCustomerNotesInApp,
          canEditEquipmentItems: technician.canEditEquipmentItems,
          canCreateJobsInApp: technician.canCreateJobsInApp,
          canEditJobsInApp: technician.canEditJobsInApp,
          canCreateQuotes: technician.canCreateQuotes,
          canCreateRouteStops: technician.canCreateRouteStops,
          canAccessCustomerDetails: technician.canAccessCustomerDetails,
          canViewJobHistory: technician.canViewJobHistory,
          canViewQuoteHistory: technician.canViewQuoteHistory,
          canViewInvoiceHistory: technician.canViewInvoiceHistory,
          canViewPaymentHistory: technician.canViewPaymentHistory,
          canEditGateCodes: technician.canEditGateCodes,
          canEditPropertyAccessInstructions: technician.canEditPropertyAccessInstructions,
          canEditDogInfo: technician.canEditDogInfo,
          canSendJobEmailsToCustomers: technician.canSendJobEmailsToCustomers,
          canSeePricesAmounts: technician.canSeePricesAmounts,
          canCreateInvoiceInApp: technician.canCreateInvoiceInApp,
          canEditInvoiceInApp: technician.canEditInvoiceInApp,
          canSendInvoiceEmailsToCustomers: technician.canSendInvoiceEmailsToCustomers,
        };
        $scope.showEditField = [];
        $scope.techEditModel[index].userTypes = {
          cleaningtech: false,
          installer: false
        };
        $scope.imgdataedit[index] = $scope.techEditModel[index].userImage;
        angular.forEach($scope.techEditModel[index].roles, function(v) {
          if (v.key == "cleaningtech") {
            $scope.techEditModel[index].userTypes.cleaningtech = true;
          }
          if (v.key == "installer") {
            $scope.techEditModel[index].userTypes.installer = true;
          }
        });
      }
      $scope.showEditField[index] = !$scope.showEditField[index];
    };

    $scope.cancelEdit = function(i) {
      $scope.showEditField[i] = false;
    };

    $scope.setCanSeeCustDetails = function(userId, changeIn) {
      $scope.pmModel.techId = userId;
      if (changeIn == "canSeeCustDetails") {
        $scope.pmModel.canSeeCustDetails = $scope.pmModel.canSeeCustDetails == 1 ? 0 : 1;
      }
      if (changeIn == "canSeePricesAmounts") {
        $scope.pmModel.canSeePricesAmounts = $scope.pmModel.canSeePricesAmounts == 1 ? 0 : 1;
      }
      if (changeIn == "psCheck") {
        $scope.pmModel.accessForProducts = $scope.pmModel.accessForProducts == 1 ? 0 : 1;
        $scope.pmModel.canSeePricesAmounts = $scope.pmModel.accessForProducts;
      }
      if (changeIn == "canCreatePSInApp") {
        $scope.pmModel.canCreateProductsServiceInApp = $scope.pmModel.canCreateProductsServiceInApp == 1 ? 0 : 1;
      }
      if (changeIn == "canEditOnTheWayTextMessage") {
        $scope.pmModel.canEditOnTheWayTextMessage = $scope.pmModel.canEditOnTheWayTextMessage == 1 ? 0 : 1;
      }
      if (changeIn == "showCaptionInCustomerEmail") {
        $scope.pmModel.showCaptionInCustomerEmail = $scope.pmModel.showCaptionInCustomerEmail == 1 ? 0 : 1;
      }
      if (changeIn == "canCreateCustomerNotesInApp") {
        $scope.pmModel.canCreateCustomerNotesInApp = $scope.pmModel.canCreateCustomerNotesInApp == 1 ? 0 : 1;
      }
      if (changeIn == "canEditEquipmentItems") {
        $scope.pmModel.canEditEquipmentItems = $scope.pmModel.canEditEquipmentItems == 1 ? 0 : 1;
      }
      if (changeIn == "canCreateJobsInApp") {
        $scope.pmModel.canCreateJobsInApp = $scope.pmModel.canCreateJobsInApp == 1 ? 0 : 1;
      }
      if (changeIn == "canEditJobsInApp") {
        $scope.pmModel.canEditJobsInApp = $scope.pmModel.canEditJobsInApp == 1 ? 0 : 1;
      }
      if (changeIn == "canCreateQuotes") {
        $scope.pmModel.canCreateQuotes = $scope.pmModel.canCreateQuotes == 1 ? 0 : 1;
      }
      if (changeIn == "canCreateRouteStops") {
        $scope.pmModel.canCreateRouteStops = $scope.pmModel.canCreateRouteStops == 1 ? 0 : 1;
      }
      if (changeIn == "canAccessCustomerDetails") {
        $scope.pmModel.canAccessCustomerDetails = $scope.pmModel.canAccessCustomerDetails == 1 ? 0 : 1;
        if ($scope.pmModel.canAccessCustomerDetails == 0) {
          $scope.pmModel.canViewJobHistory = 0;
          $scope.pmModel.canViewQuoteHistory = 0;
          $scope.pmModel.canViewInvoiceHistory = 0;
          $scope.pmModel.canViewPaymentHistory = 0;
          $scope.pmModel.canEditGateCodes = 0;
          $scope.pmModel.canEditPropertyAccessInstructions = 0;
          $scope.pmModel.canEditDogInfo = 0;
        }
      }
      if (changeIn == "canViewJobHistory") {
        $scope.pmModel.canViewJobHistory = $scope.pmModel.canViewJobHistory == 1 ? 0 : 1;
      }
      if (changeIn == "canViewQuoteHistory") {
        $scope.pmModel.canViewQuoteHistory = $scope.pmModel.canViewQuoteHistory == 1 ? 0 : 1;
      }
      if (changeIn == "canViewInvoiceHistory") {
        $scope.pmModel.canViewInvoiceHistory = $scope.pmModel.canViewInvoiceHistory == 1 ? 0 : 1;
      }
      if (changeIn == "canViewPaymentHistory") {
        $scope.pmModel.canViewPaymentHistory = $scope.pmModel.canViewPaymentHistory == 1 ? 0 : 1;
      }
      if (changeIn == "canEditGateCodes") {
        $scope.pmModel.canEditGateCodes = $scope.pmModel.canEditGateCodes == 1 ? 0 : 1;
      }
      if (changeIn == "canEditPropertyAccessInstructions") {
        $scope.pmModel.canEditPropertyAccessInstructions = $scope.pmModel.canEditPropertyAccessInstructions == 1 ? 0 : 1;
      }
      if (changeIn == "canEditDogInfo") {
        $scope.pmModel.canEditDogInfo = $scope.pmModel.canEditDogInfo == 1 ? 0 : 1;
      }
      if (changeIn == "canSendJobEmailsToCustomers") {
        $scope.pmModel.canSendJobEmailsToCustomers = $scope.pmModel.canSendJobEmailsToCustomers == 1 ? 0 : 1;
      }
      if (changeIn == "canCreateInvoiceInApp") {
        $scope.pmModel.canCreateInvoiceInApp = $scope.pmModel.canCreateInvoiceInApp == 1 ? 0 : 1;
      }
      if (changeIn == "canEditInvoiceInApp") {
        $scope.pmModel.canEditInvoiceInApp = $scope.pmModel.canEditInvoiceInApp == 1 ? 0 : 1;
      }
      if (changeIn == "canSendInvoiceEmailsToCustomers") {
        $scope.pmModel.canSendInvoiceEmailsToCustomers = $scope.pmModel.canSendInvoiceEmailsToCustomers == 1 ? 0 : 1;
      }
      $scope.isProcessing = true;
      apiGateWay.send("/tech_permission_for_custDetails", $scope.pmModel).then(function(response) {
        if(response.status == 200){
          angular.forEach($scope.technicianList,function(element){
            if(element.id == userId){
              element.canSeeCustDetails = response.data.data.canSeeCustDetails;
              element.accessForProducts = response.data.data.accessForProducts;
              element.canCreateProductsServiceInApp = response.data.data.canCreateProductsServiceInApp;
              element.canEditOnTheWayTextMessage = response.data.data.canEditOnTheWayTextMessage;
              element.showCaptionInCustomerEmail = response.data.data.showCaptionInCustomerEmail;
              element.canCreateCustomerNotesInApp = response.data.data.canCreateCustomerNotesInApp;
              element.canEditEquipmentItems = response.data.data.canEditEquipmentItems;
              element.canCreateJobsInApp = response.data.data.canCreateJobsInApp;
              element.canEditJobsInApp = response.data.data.canEditJobsInApp;
              element.canCreateQuotes = response.data.data.canCreateQuotes;
              element.canCreateRouteStops = response.data.data.canCreateRouteStops;
              element.canAccessCustomerDetails = response.data.data.canAccessCustomerDetails;
              element.canViewJobHistory = response.data.data.canViewJobHistory;
              element.canViewQuoteHistory = response.data.data.canViewQuoteHistory;
              element.canViewInvoiceHistory = response.data.data.canViewInvoiceHistory;
              element.canViewPaymentHistory = response.data.data.canViewPaymentHistory;
              element.canEditGateCodes = response.data.data.canEditGateCodes;
              element.canEditPropertyAccessInstructions = response.data.data.canEditPropertyAccessInstructions;
              element.canEditDogInfo = response.data.data.canEditDogInfo;
              element.canSendJobEmailsToCustomers = response.data.data.canSendJobEmailsToCustomers;
              element.canSeePricesAmounts = response.data.data.canSeePricesAmounts;
              element.canCreateInvoiceInApp = response.data.data.canCreateInvoiceInApp;
              element.canEditInvoiceInApp = response.data.data.canEditInvoiceInApp;
              element.canSendInvoiceEmailsToCustomers = response.data.data.canSendInvoiceEmailsToCustomers;
            }
          });
        }
        $scope.isProcessing = false;
      },
      function(error) {
        $scope.isProcessing = false;
      });
    }

    //to invite user by submit data
    $scope.setStatus = function(userId, isActive, index, technician) {
      if (userId != "" && (isActive == 0 || isActive == 1)) {
        $scope.isProcessing = true;
        isActive = isActive == 1 ? 0 : 1;
        updateStatus(userId, isActive, technician);
        /* if(isActive){
          apiGateWay.send("/check_company_subscription", {}).then(function(response) {
              if (response.data.status == 200) {
                  var responseData = response.data.data;
                  if(!responseData.paymentStatus){
                      var amount = responseData.amount;
                      var message = responseData.message;
                      $scope.confirmAlert({userId: userId, isActive: isActive, message: message}, 'prorated');

                      // if(confirm(message)){
                      //       updateStatus(userId, isActive);
                      // }else{
                      //     $scope.isProcessing = false;
                      // }
                      $scope.isProcessing = false;
                  }else{
                    updateStatus(userId, isActive);
                  }
              }
              $scope.isProcessing = false;
          });
        }else{
            updateStatus(userId, isActive);
        } */
      }
    };

    var updateStatus = function(userId, isActive, technician){
        let isLastItemButNotOnFirstPage = ($scope.currentPage - 1 > 0) && $scope.technicianList.length == 1 && $scope.currentFilterValue != 'All';        
        if (isLastItemButNotOnFirstPage) {  
          $scope.currentPage = $scope.currentPage - 1;
          $scope.showingFrom = ($scope.currentPage) * $scope.limit - ($scope.limit-1);                    
        }
        let params = { 
          userId: userId,
          isActive: isActive,
          limit: $scope.limit,
          offset: $scope.currentPage - 1,
          status: $scope.currentFilterValue,
          userNameORAddress: $scope.userNameORAddress
        }
        apiGateWay.send("/technician_status", params).then(function(response) {
              if (response.data.status == '201' || response.data.status == '200') {
                if (technician) {
                  technician.isActive = isActive;
                  $scope.parseTechListData(response.data.data)
                } else {
                  getWithOutMeidTechnician();
                  $scope.getMeidList()
                  $scope.getTechnicianList();
                  $scope.getDeviceList();                  
                }
                $scope.isProcessing = false;
                $scope.successMsg3 = response.data.message;
                if (!$scope.$$phase) $scope.$apply();
                setTimeout(function() {
                  $scope.successMsg3 = false;
                }, 1000);
                $scope.error = "";
                $scope.resetProcess();
              } else {
                $scope.successMsg3 = "";
                $scope.isProcessing = false;
                $scope.error3 = response.data.message;
                var analyticsData = {};
                analyticsData.requestData = {
                  userId: userId,
                  isActive: isActive
                };
                analyticsData.userData = $rootScope.userSession;
                analyticsData.actionTime = new Date();
                analyticsData.errorData = response.data;
                var analyticsDataString = JSON.stringify(analyticsData);
                var currentDateTime = $filter("date")(
                  new Date(),
                  "MM/dd/yyyy hh:m:ss a"
                );
                $rootScope.storeAnalytics(
                  "Error - Technician Status",
                  "Error on technician status - " + currentDateTime,
                  analyticsDataString,
                  0,
                  true
                );
              }
              $scope.isProcessing = false;
            },
            function(error) {
              var msg = "Error";
              if (
                typeof error == "object" &&
                error.data &&
                error.data.message
              ) {
                msg = error.data.message;
              } else {
                msg = error;
              }
              $scope.successMsg = "";
              $scope.error3 = msg;
              setTimeout(function() {
                $scope.error3 = "";
                $scope.isProcessing = false;
              }, 2000);
              $scope.isProcessing = false;
              var analyticsData = {};
              analyticsData.requestData = {
                userId: userId,
                isActive: isActive
              };
              analyticsData.userData = $rootScope.userSession;
              analyticsData.actionTime = new Date();
              analyticsData.errorData = error;
              var analyticsDataString = JSON.stringify(analyticsData);
              var currentDateTime = $filter("date")(
                new Date(),
                "MM/dd/yyyy hh:m:ss a"
              );
              $rootScope.storeAnalytics(
                "Error - Technician Status",
                "Error on technician status - " + currentDateTime,
                analyticsDataString,
                0,
                true
              );
            }
          );
    }

    //to show chemical cost on dialog
    /* $scope.assignMeidDeviceModal = function(type, dataObj) {
        $scope.type = type;
        $scope.assignmentModel.meidDevice = '';
        $scope.dataObj = dataObj;
        $scope.assignmentDialog = ngDialog.open({
            template: 'assignMeidDeviceModal.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {
              $scope.type = '';
              $scope.dataObj = '';
            }
        });

    }; */

    //to get meid list
    $scope.meidListResponse = [];
    $scope.assignmentModel = {meidDevice: ''};


    $scope.assignMeidDevice = function(dataObj, type){
        $scope.isMeidDeviceProcessing = true;
        $scope.successMsg3 = "";
        $scope.error3 = "";
        var endPoint = "/assign_device_tech";
        var params = {};
        if($scope.type=='meid'){
          endPoint = "/assign_meid_tech"
          params = {techUserId: dataObj.id, meid: $scope.assignmentModel.meidDevice};
        }else{
          params = {techUserId: dataObj.id, deviceCompId: $scope.assignmentModel.meidDevice};
        }

        apiGateWay.send(endPoint, params).then(function(response) {
          $scope.meidList = [];
          if (response.data.status == 200) {
            $scope.getTechnicianList();
            $scope.getDeviceList();
            $scope.getMeidList();
            $scope.successMsg3 = response.data.message;
            $scope.error3 = '';
            setTimeout(function() {
              $scope.successMsg3 = "";
              if (!$scope.$$phase) $scope.$apply();
            }, 2000);

            $scope.assignmentDialog.close();
          }else{
            $scope.error3 = response.data.message;
            setTimeout(function() {
              $scope.error3 = "";
              if (!$scope.$$phase) $scope.$apply();
            }, 2000);
            if (!$scope.$$phase) $scope.$apply();
            $scope.successMsg3 = '';
          }
          $scope.isMeidDeviceProcessing = false;
        },function(error) {
          $scope.isMeidDeviceProcessing = false;
        });
    }

  $scope.confirmAlert = function(dataObj, type){
      $scope.dataObj = dataObj;
      $scope.type = type;
      if(type=='deletemeid'){
          $scope.alertMessage = 'Are you sure, you want to delete MEID?';
      }else if($scope.type=='prorated'){
        $scope.alertMessage = dataObj.message;
      }else if($scope.type=='addtech'){
        $scope.alertMessage = dataObj.message;
      }else{
        $scope.alertMessage = 'Are you sure, you want to remove '+(type == 'meid' ? 'MEID' : 'Device')+' from technician?';
      }
      openModal();
  }


  var openModal = function(){
    $scope.assignmentDialog = ngDialog.open({
        template: 'alertModal.html',
        className: 'ngdialog-theme-default',
        scope: $scope,
        preCloseCallback: function() {
          $scope.dataObj = '';
          $scope.type = '';
          $scope.alertMessage = '';
        }
    });
  }

  $scope.confirmAction = function(){
      if($scope.type=='deletemeid'){
          $scope.deleteMeid($scope.dataObj);
      }else if($scope.type=='prorated'){
          updateStatus($scope.dataObj.userId, $scope.dataObj.isActive);
      }else if($scope.type=='addtech'){
          addEditTechnician($scope.dataObj.i, $scope.dataObj.meid, $scope.dataObj.techModel);
      }else{
        $scope.removeMeidDevice($scope.dataObj, $scope.type);
      }
      $scope.closeModal();
  }

  $scope.closeModal = function(){
    ngDialog.closeAll();
    if ($scope.assignmentDialog) {
      $scope.assignmentDialog.close();
    }
  }

  $scope.removeMeidDevice = function(dataObj, type){
      $scope.successMsg3 = "";
      $scope.error3 = "";
          $scope.isProcessing = true;
          apiGateWay.send("/remove_meid_device_tech", {type: type, techUserId: dataObj.id, deviceTechMapId: dataObj.deviceTechMapId}).then(function(response) {
            if (response.data.status == 200) {
              $scope.getTechnicianList();
              $scope.getDeviceList();
              $scope.getMeidList();
              $scope.successMsg3 = response.data.message;
              $scope.error3 = '';
              setTimeout(function() {
                $scope.successMsg3 = "";
                if (!$scope.$$phase) $scope.$apply();
              }, 2000);
            }else{
              $scope.error3 = response.data.message;
              setTimeout(function() {
                $scope.error3 = "";
                if (!$scope.$$phase) $scope.$apply();
              }, 2000);
              if (!$scope.$$phase) $scope.$apply();
              $scope.successMsg3 = '';
            }
            $scope.isProcessing = false;
          },function(error) {
            $scope.isProcessing = false;
          });

    }
    $scope.removeProfilePicture = function(index){
      $scope.imgdataedit[index] = ''
    }


    $scope.addTechnicianConfirm = function(){      
      ngDialog.open({
          template: 'addTechnicianConfirm.html',
          className: 'ngdialog-theme-default v-center',
          overlay: true,
          closeByNavigation: true,
          scope: $scope,
          preCloseCallback: function () {         
            $scope.index = '';       
          }
      });
    } 




  });
