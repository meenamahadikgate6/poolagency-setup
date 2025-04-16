angular.module('POOLAGENCY').controller('contactissueController', function($scope, $rootScope, $filter, $sce, apiGateWay, auth, service, ngDialog, Analytics) {


    $scope.hidden = true;

    $scope.loggedInRole = auth.loggedInRole();


    var model = {
      subject:'',
      message:'',
      reply:''
    }

    $scope.model = angular.copy(model);

      $scope.sss='';

    $scope.currentPageMeid = $scope.currentPage = 1;
    $scope.limit = 10;
    $scope.userName = '';
    $scope.address = '';
    $scope.isProcessing = false;
    $scope.image = [];
    $scope.column = 'id';
    $scope.searchName = '';
    $scope.imageedit = [];
    $scope.techForm = [];
    $scope.techEditForm = [];
    $scope.successMsg = '';
    $scope.errorArr = [];
    $scope.techEditModel = [];
    //error
    $scope.success = '';
    $scope.error = '';
    //Get Contact List
    $scope.getIssueList = function() {
        $scope.isProcessing = true;
        var unix = Math.round(+new Date()/1000);
        apiGateWay.get("/company/company_contact?time="+unix, {
            offset: $scope.currentPage - 1,
            limit: $scope.limit,
            dir: $scope.dir,
            column: $scope.column,
            searchName: $scope.searchName,
        }).then(function(response) {
            if (response.data.status == 200) {
                var issueListResponse = response.data.data;
                $scope.totalRecord = issueListResponse.rows;
                $scope.totalPage = ($scope.totalRecord % $scope.limit) !== 0 ? parseInt($scope.totalRecord / $scope.limit) : parseInt(($scope.totalRecord / $scope.limit)) - 1;
                $scope.issueList = issueListResponse.data;
                if (!$scope.$$phase) $scope.$apply()
            } else {
                $scope.issueList = [];
            }
            $scope.isProcessing = false;
        }, function(error) {
            var analyticsData = {};
            analyticsData.requestData = {
                offset: $scope.currentPage - 1,
                limit: $scope.limit,
                dir: $scope.dir,
                column: $scope.column,
                searchName: $scope.searchName,
                userNameORAddress: $scope.companyId
            };
            analyticsData.userData = $rootScope.userSession;
            analyticsData.actionTime = new Date();
            analyticsData.errorData = error;
            var analyticsDataString = JSON.stringify(analyticsData);
            var currentDateTime = $filter('date')(new Date(), "MM/dd/yyyy hh:m:ss a");
            $rootScope.storeAnalytics('Error - Get issue List', "Error on getIssueList - " + currentDateTime, analyticsDataString, 0, true);
        });
    };
    //Add Issue
    $scope.addIssue = function(contactId){
        $scope.success = false;
        $scope.error = false;
        $scope.isProcessing = true;
        var apiName ='';
        if(contactId){
            $scope.model.contactId = contactId;
            $scope.model.reply = $scope.model.reply;
            apiName = 'update_company_contact';
        } else {
            apiName = 'company_contact';
        }
        $scope.isProcessing = true;
        apiGateWay.send("/company/"+apiName, $scope.model).then(function(response) {
            var responseData = response.data;
            var message = responseData && responseData.message ? responseData.message : '';
            if (responseData.status == 201) {
                $scope.success = message;
                $scope.getIssueList();
                $scope.closeModal();
            }else{
                $scope.responseData = message;
            }
            $scope.resetProcess();
        },function(errorResponse){
            $scope.error = errorResponse;
            $scope.resetProcess();
        });
    }
    $scope.closeModal = function(){
        ngDialog.close();
    }

      $scope.resetProcess = function(){
        setTimeout(function(){
          $scope.success = false;
          $scope.error = false;
        }, 2000);
        $scope.isProcessing = false;
      }





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
    $scope.changePage = function(page) {
        $scope.currentPage = page;
        $scope.getIssueList();
    };


    //to show address list on dialog
    $scope.showAddressList = function(addressList, selectedissueId) {
        ngDialog.open({
            template: 'addressList.html',
            className: 'ngdialog-theme-default',
            scope: $scope,
            preCloseCallback: function() {
                /* Do something here*/
                $scope.selectedissueId = 0;
                $scope.addressListOnModel = {};
            }
        });
        $scope.addressListOnModel = addressList;
        $scope.selectedissueId = selectedissueId;
    };

    //to search issue by entered name
    $scope.doSearchissueList = function($event) {
        //if ($event.target.value || $scope.issueList.length ==0) {
        $scope.userNameORAddress = $event.target.value.trim().replace(/,/g, "")
        $scope.getIssueList();
        //}
    };



    $scope.browseImage = function() {
        document.getElementById('profileImage').click();
    };
    $scope.profileImage = '';

    $scope.uploadFile = function() {
        var imageData = $scope.model.profileImage;
        $scope.profileImage = 'data:image/png;base64,' + imageData.base64;
    };


    $scope.addIssuePopup = function(data){

        ngDialog.open({
            template: 'templates/addissueformfields.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default',
            scope: $scope,
            closeByDocument: false,
            preCloseCallback: function() {
              $scope.model = angular.copy(model);
            }
        });
    }
    $scope.addReplyPopup = function(data){
        $scope.companyMessageData = data;
        ngDialog.open({
            template: 'templates/addissuesreplyformfields.html?ver=' + $rootScope.PB_WEB_VERSION,
            className: 'ngdialog-theme-default',
            scope: $scope,
            closeByDocument: false,
            preCloseCallback: function() {
              $scope.model = angular.copy(model);
              $scope.companyMessageData = '';
            }
        });
    }


    $scope.showaddmsg = function(data){
        $scope.desc = data;
       ngDialog.open({
           template: 'templates/showissuedetail.html?ver=' + $rootScope.PB_WEB_VERSION,
           className: 'ngdialog-theme-default',
           scope: $scope,
           closeByDocument: false,
           preCloseCallback: function() {

           }
       });
   }


   $scope.orderByCompanyList = function(column) {
        $scope.column = column;
        $scope.dir = ($scope.dir == 'desc') ? 'asc' : 'desc';
        $scope.getIssueList();
   };

   $scope.doSearchCompanyList = function($event) {
        $scope.currentPage = 1;
        $scope.searchName = $event.target.value.trim().replace(/,/g, "")
        $scope.getIssueList();

   };



});
