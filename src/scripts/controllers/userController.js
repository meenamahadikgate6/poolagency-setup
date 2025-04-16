angular
  .module("POOLAGENCY")
  .controller("userController", function(
    $scope,
    $rootScope,
    $filter,
    $sce,
    apiGateWay,
    service,
    ngDialog,
    Analytics
  ) {
    $scope.currentPageMeid = $scope.currentPage = 1;
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
    //to get meid list
    $scope.getMeidList = function() {
      /* $scope.isProcessing = true;
      apiGateWay
        .get("/meid", {
          offset: $scope.currentPage - 1,
          limit: $scope.limit,
          userNameORAddress: $scope.userNameORAddress
        })
        .then(
          function(response) {
            if (response.data.status == 200) {
              var meidListResponse = response.data.data;
              $scope.totalRecordMeid = meidListResponse.rows;
              $scope.totalPageMeid =
                $scope.totalRecordMeid % $scope.limit !== 0
                  ? parseInt($scope.totalRecordMeid / $scope.limit)
                  : parseInt($scope.totalRecordMeid / $scope.limit) - 1;
              $scope.meidList = meidListResponse;
            } else {
              $scope.meidList = [];
            }
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
              "Error - Get Meid List",
              "Error on getMeidList - " + currentDateTime,
              analyticsDataString,
              0,
              true
            );
          }
        ); */
    };

    //to get technician list
    $scope.getTechnicianList = function() {
      $scope.isProcessing = true;
      apiGateWay
        .get("/technicians", {
          offset: $scope.currentPage - 1,
          limit: $scope.limit,
          userNameORAddress: $scope.userNameORAddress
        })
        .then(
          function(response) {
            if (response.data.status == 200) {
              var technicianListResponse = response.data.data;
              $scope.totalRecord = technicianListResponse.rows;
              $scope.totalPage =
                $scope.totalRecord % $scope.limit !== 0
                  ? parseInt($scope.totalRecord / $scope.limit)
                  : parseInt($scope.totalRecord / $scope.limit) - 1;
              $scope.technicianList = technicianListResponse.data;
            } else {
              $scope.technicianList = [];
            }
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
    //make input file clicked
    $scope.browseImage = function(i, type) {
      type = type ? type : "";
      document.getElementById("image" + type + i).click();
    };
    $scope.imgdata = [];
    $scope.uploadFile = function(i) {
      var imageData = $scope.image[i];
      if(["image/gif", "image/png", "image/jpeg"].indexOf(imageData.filetype) != -1){
          $scope.imgdata[i] = "data:image/png;base64," + imageData.base64;
      }else{
          $scope.imgdata[i] = "";
          $scope.errorArr[i] = "Please select image format in JPEG PNG and GIF.";
          setTimeout(function() {
            $scope.errorArr[i] = "";
            $scope.isProcessing = false;
          }, 2000);
      }
    };

    $scope.imgdataedit = [];
    $scope.showEditField = [];
    $scope.uploadFileEdit = function(i) {
      var imageData = $scope.imageedit[i];
      if(["image/gif", "image/png", "image/jpeg"].indexOf(imageData.filetype) != -1){
          $scope.imgdataedit[i] = "data:image/png;base64," + imageData.base64;
      }else{
          $scope.imgdataedit[i] = "";
          $scope.errorArr[i] = "Please select image format in JPEG PNG and GIF.";
          setTimeout(function() {
            $scope.errorArr[i] = "";
            $scope.isProcessing = false;
          }, 2000);
      }

    };
    var tModel = $scope.techModel2;
    //to save technicin data by api
    $scope.addEditTechnician = function(i, meid, techModel) {
      if ($scope.techForm[i].$valid) {
        techModel.meid = meid;
        techModel.userImage = $scope.imgdata[i];
        $scope.isProcessing = true;
        var userTypes = techModel.userTypes;
        // $scope.techModel[i] = techModel;
        var uType = [];
        angular.forEach(userTypes, function(k, v) {
          if (k == true) {
            uType.push(v);
          }
        });
        var techModelNew = angular.copy(techModel);
        techModelNew.userTypes = uType;
        var techModelAnal = techModelNew;
        apiGateWay.send("/technicians", techModelNew).then(
          function(response) {
            if (response.data.status == 201) {
              techModel = tModel;
              angular
                .element(document.getElementById("meidFormDiv" + i))
                .remove();
              $scope.successMsg = response.data.message;
              $scope.getTechnicianList();
              $scope.selectedIndex = -1;
              setTimeout(function() {
                $scope.successMsg = "";
                $scope.getMeidList();
                $scope.isProcessing = false;
              }, 1000);
              $scope.error = "";
              var analyticsData = {};
              analyticsData.userData = $rootScope.userSession;
              analyticsData.data = techModelAnal;
              analyticsData.actionTime = new Date();
              var analyticsDataString = JSON.stringify(analyticsData);
              var currentDateTime = $filter("date")(
                new Date(),
                "MM/dd/yyyy hh:m:ss a"
              );
              $rootScope.storeAnalytics(
                "Technician",
                "Add Technician for MEID - " + meid + " - " + currentDateTime,
                analyticsDataString,
                0,
                true
              );
            } else {
              $scope.successMsg = "";
              $scope.errorArr[i] = response.data.message;
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
                "Error - Add Edit Technician",
                "Error on addEditTechnician - " + currentDateTime,
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
              "Error - Add Edit Technician",
              "Error on addEditTechnician - " + currentDateTime,
              analyticsDataString,
              0,
              true
            );
            $scope.successMsg = "";
            $scope.errorArr[i] = msg;
            setTimeout(function() {
              $scope.errorArr[i] = "";
              $scope.isProcessing = false;
            }, 2000);
          }
        );
      }
    };

    $scope.editTechnician = function(i) {
      if ($scope.techEditForm[i].$valid) {
        $scope.techEditModel[i].userImage = $scope.imgdataedit[i];

        $scope.isProcessing = true;

        var userTypes = $scope.techEditModel[i].userTypes;
        // $scope.techModel[i] = techModel;
        var uType = [];
        angular.forEach(userTypes, function(k, v) {
          if (k == true) {
            uType.push(v);
          }
        });
        var techModelNew = angular.copy($scope.techEditModel[i]);
        techModelNew.userTypes = uType;
        var techModelAnal = techModelNew;
        techModelNew["phoneNumber"] = techModelNew["contactNumber"];
        apiGateWay.send("/technicians", techModelNew).then(
          function(response) {
            if (response.data.status == 201) {
              $scope.successMsg3 = response.data.message;

              $scope.showEditField[i] = false;
              setTimeout(function() {
                $scope.successMsg3 = "";
                $scope.isProcessing = false;
                $scope.getTechnicianList();
              }, 1000);
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
              $rootScope.storeAnalytics(
                "Technician",
                "Edit Technician - " + currentDateTime,
                analyticsDataString,
                0,
                true
              );
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
            }, 2000);
          }
        );
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
      if ($scope.inviteForm.$valid) {
        $scope.isProcessing = true;
        apiGateWay.send("/invite_email", $scope.inviteModel).then(
          function(response) {
            if (response.data.status == 201) {
              $scope.isProcessing = false;
              $scope.successMsg2 = response.data.message;
              $scope.inviteModel = {};
              setTimeout(function() {
                $scope.successMsg2 = false;
                $scope.toggleInvite();
              }, 1000);
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
              var currentDateTime = $filter("date")(
                new Date(),
                "MM/dd/yyyy hh:m:ss a"
              );
              $rootScope.storeAnalytics(
                "Error - Invite",
                "Error on invite - " + currentDateTime,
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
            $scope.successMsg2 = "";
            $scope.error2 = msg;
            setTimeout(function() {
              $scope.error2 = "";
              $scope.isProcessing = false;
            }, 2000);
            $scope.isProcessing = false;
            var analyticsData = {};
            analyticsData.requestData = $scope.inviteModel;
            analyticsData.userData = $rootScope.userSession;
            analyticsData.actionTime = new Date();
            analyticsData.errorData = error;
            var analyticsDataString = JSON.stringify(analyticsData);
            var currentDateTime = $filter("date")(
              new Date(),
              "MM/dd/yyyy hh:m:ss a"
            );
            $rootScope.storeAnalytics(
              "Error - Invite",
              "Error on invite - " + currentDateTime,
              analyticsDataString,
              0,
              true
            );
          }
        );
      }
    };

    $scope.showEdit = function(technician, index) {
      $scope.techEditModel[index] = angular.copy(technician);
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
      $scope.showEditField[index] = !$scope.showEditField[index];
    };
    $scope.cancelEdit = function(i) {
      $scope.showEditField[i] = false;
    };

    //to invite user by submit data
    $scope.setStatus = function(userId, isActive) {
      if (userId != "" && (isActive == 0 || isActive == 1)) {
        $scope.isProcessing = true;
        isActive = isActive == 1 ? 0 : 1;
        apiGateWay
          .send("/technician_status", { userId: userId, isActive: isActive })
          .then(
            function(response) {
              if (response.data.status == 201 || response.data.status == 200) {
                $scope.isProcessing = false;
                $scope.successMsg3 = response.data.message;
                $scope.getTechnicianList();
                setTimeout(function() {
                  $scope.successMsg3 = false;
                }, 1000);
                $scope.error = "";
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
    };
  });
