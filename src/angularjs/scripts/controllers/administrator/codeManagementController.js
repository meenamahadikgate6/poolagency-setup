angular
  .module("POOLAGENCY")

  .controller("codeManagementController", function($scope, $state, $filter, apiGateWay, ngDialog) {

    $scope.model={versionName:"",versionDescription:""}
    $scope.offset = 0;
    $scope.limit = 10;
    $scope.currentPage = 1;
    $scope.codeList = [];
    $scope.files = [];
    $scope.getcodeList = function() {
      $scope.isProcessing = true;
      apiGateWay.get("/administrator/code_version", {
          offset: $scope.currentPage - 1,
          limit: $scope.limit
        })
        .then(
          function(response) {
            var responseData = response.data;
            if (responseData.status == 200) {
              var responseResult = responseData.data;
              $scope.totalRecord = responseResult.total;
              $scope.totalPage =
                $scope.totalRecord % $scope.limit !== 0
                  ? parseInt($scope.totalRecord / $scope.limit)
                  : parseInt($scope.totalRecord / $scope.limit) - 1;
              $scope.isProcessing = false;
              $scope.codeList = responseResult.result;
              var verNo = "1";
              if($scope.totalRecord > 0)
              {
                verNo = parseInt($scope.codeList[0].versionNo) + 1;
              }
              $scope.model.versionName = "v"+verNo;
            } else {
              $scope.isProcessing = false;
            }
            $scope.resetProcess();
          },
          function(errorResponse) {
            //$scope.error = errorResponse;
            $scope.isProcessing = false;
          }
        );
    };



    $scope.uploadFiles = function(){

        ngDialog.open({
            template: 'templates/administrator/codeManageForm.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default',
            scope: $scope,
            closeByDocument: false,
            preCloseCallback: function() {

            }
        });
    }

    $scope.downloadFile = function(fileName, versionName){
      $scope.isProcessingDownload = true;
      apiGateWay.get("/administrator/download_code_file", {version: versionName, file: fileName}).then(function(response) {
          if(response.data.status == 200){
              var zipFilePath = response.data.data;
              window.open(zipFilePath, '_blank');
          }
          $scope.resetProcess();
      },function(errorResponse) {
            $scope.errorDownload = errorResponse;
            $scope.resetProcess();
      });
    };


    $scope.changePage = function(pageNumber) {
      $scope.currentPage = pageNumber;
      $scope.getcodeList();
    };

    $scope.codeFiles = [];
    $scope.viewFiles = function(data, index) {
      data = data || {};
      $scope.index = index;
      if (data) {
        var files= data.codeFiles.split(",");
        $scope.codeFiles = files;
        $scope.versionName = data.versionName;
      }
      ngDialog.open({
        template: "codeFiles.html",
        className: "ngdialog-theme-default",
        scope: $scope,
        preCloseCallback: function() {
          $scope.codeFiles = '';
          $scope.versionName = '';
        }
      });
    };

    $scope.closeModal = function() {
      ngDialog.close();
    };

    $scope.isProcessing = false;
    $scope.uploadCodeFiles = function() {
      var fd = new FormData();
      angular.forEach($scope.files, function(file) {
        fd.append("codeFiles", file);
      });
      fd.append("versionName",$scope.model.versionName);
      fd.append("versionDescription", $scope.model.versionDescription);
      $scope.success = false;
      $scope.error = false;
      $scope.isProcessing = true;
      apiGateWay
        .post("/administrator/code_version", fd)
        .then(
          function(response) {
            var responseData = response.data;
            var message =
              responseData && responseData.message
                ? responseData.message
                : "";
            if (responseData.status == 200) {
                $scope.model = {};
                angular.element("input[type='file']").val(null);
                $scope.model.versionDescription = '';
                $scope.codeFileForm.$setPristine();
                $scope.getcodeList();
              $scope.success = message;
              $scope.closeModal();
            } else {
              $scope.responseData = message;
            }
            $scope.resetProcess();
          },
          function(errorResponse) {
            $scope.error = errorResponse;
            $scope.resetProcess();
          }
        );
    };



    $scope.resetProcess = function() {
      setTimeout(function() {
        $scope.success = false;
        $scope.error = false;
        $scope.errorDownload = false;
        if (!$scope.$$phase) $scope.$apply();
      }, 2000);
      $scope.isProcessingDownload = false;
      $scope.isProcessing = false;
    };
  });
