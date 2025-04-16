angular.module('POOLAGENCY')

.controller('customerNotesTabController', function($rootScope, $scope, apiGateWay, ngDialog, $timeout, auth) {  
  $scope.customerInfo = {
    customerId: 0,
    addressId: 0
  };
  $scope.newBlankNoteModel = { 
    noteTxt: '',
    addressId: 0,
    customerId: 0,
    isPin: 0,
    notesId: 0,
    status: 1,
  };
  $scope.customerNotes = [];
  $scope.customerNotesLessLength = 170;
  $scope.notesModel = {};
  $scope.isCustomerNotesFetching = true;
  $scope.isCustomerNotesCreating = false;
  $scope.isCustomerNotesUpdating = false;
  $scope.isCustomerNotesDeleting = false;
  $scope.customerNotesSuccess = '';
  $scope.customerNotesError = '';
  $scope.isCreateMode = false;
  $scope.isUpdateMode = false;
  $scope.isDeleteMode = false;  
  $scope.loadMoreBtnEnable = false,
  $scope.apiParams = {
    limit: 1000,
    offset: 0,
    customerId: 0
  };
  let session = $rootScope.userSession;
  $scope.userId = session.userId ? session.userId : 0;
  $scope.isSuperAdmin = session.userType === "administrator" && session.isSuperAdmin === 1;    
  $scope.canDeleteOtherCustomerNotes = session.canDeleteNotes === 1 ? true : false;
  $scope.setCustomerInfo = (info, method) => {
    $scope.customerInfo.customerId = info.customer.customerId ? info.customer.customerId : 0;
    $scope.customerInfo.addressId = info.customer.addressId ? info.customer.addressId : 0;    
    $scope.newBlankNoteModel.addressId = $scope.customerInfo.addressId;
    $scope.newBlankNoteModel.customerId = $scope.customerInfo.customerId;
    $scope.apiParams.customerId = $scope.customerInfo.customerId;
    if (method === 'getNotes') {
      $scope.getCustomerNotes();
    }
  }
  $scope.loadMore = () => {
    $scope.apiParams.offset++;
    $scope.getCustomerNotes();
  }
  $scope.getCustomerNotes = () => {
    $scope.isCustomerNotesFetching = true;
    if ($scope.apiParams.offset === 0) { $scope.customerNotes = []; }
    apiGateWay.get("/customer_notes", $scope.apiParams).then(function(response) {
      if (response.data.status == 200) {                      
        if (response.data.data.data && response.data.data.data.length > 0) {
          angular.forEach(response.data.data.data, function(_item){
            $scope.customerNotes.push({
                addressId: _item.addressId,
                companyId: _item.companyId,
                createTime: _item.createTime + 'Z',
                customerId: _item.customerId,
                notesId: _item.id,
                isPin: _item.isPin,
                noteTxt: _item.note,
                status: _item.status,
                submittedBy: _item.submittedBy,
                submittedName: _item.submittedName,
                submittedUserRoleId: _item.submittedUserRoleId,
                updateTime: _item.updateTime,
            });
          })
        }  
      }
      $scope.isCustomerNotesFetching = false;
    }, function(error) {
      $scope.isCustomerNotesFetching = false;      
    });
  };  
  $scope.readMoreEnabled = {};
  $scope.readMoreLessNotes = (index, type) => {    
    if (type=='more') $scope.readMoreEnabled[index] = true;    
    if (type=='less') $scope.readMoreEnabled[index] = false;    
  }
  $scope.openModifyCustomerNotesPopup = () => {
    setTimeout(() => {
      let textarea = document.getElementById('textareaNotes')
      if (textarea) {
        textarea.focus();
      }
    }, 100)
    $scope.modifyCustomerNotesPopup = ngDialog.open({
      template: 'modifyCustomerNotesPopup.html',
      className: 'ngdialog-theme-default v-center cnw-poup',
      scope: $scope,
      closeByDocument : $scope.isDeleteMode,
      preCloseCallback: function() {
        $scope.notesModel = {};  
        $scope.notesTextareaIsValid = true;      
      }
    });
  }
  $scope.closeModifyCustomerNotesPopup = () => {
    if ($scope.modifyCustomerNotesPopup) {
      $scope.modifyCustomerNotesPopup.close();
    }
    $scope.notesModel = {}; 
  }
  $scope.editCustomerNote = (item, method) => {
    if (method === 'create') {
      $scope.notesModel = angular.copy(item);
      $scope.notesModel.action = '';
      $scope.setMode('createMode');
      $scope.openModifyCustomerNotesPopup();
    }
    if (method === 'edit') {
      $scope.notesModel = angular.copy(item);
      $scope.notesModel.action = 'edited';
      $scope.setMode('editMode');
      $scope.openModifyCustomerNotesPopup();
    }    
    if (method === 'delete') {
      $scope.notesModel = angular.copy(item);
      $scope.notesModel.action = 'deleted';
      $scope.setMode('deleteMode');
      $scope.openModifyCustomerNotesPopup();
    } 
    if (method === 'pin') {
      if (item.isPin === 1) { 
        item.isPin = 0;       
      } else if (item.isPin === 0) { 
        item.isPin = 1;      
      }
      $scope.notesModel = angular.copy(item);
      $scope.notesModel.action = 'edited';
      $scope.setMode('editMode');
      $scope.isCustomerNotesFetching = true;
      $scope.notesTextareaIsValid = true;
      $scope.saveNotes();
    }    
  }
  $scope.notesTextareaIsValid = true;
  $scope.saveNotes = () => {       
    $scope.customerNotesFormSubmitted = true;
    $scope.notesTextareaIsValid = false;
    if ($scope.isDeleteMode || ($scope.notesModel.noteTxt && $scope.notesModel.noteTxt.trim() !== '')) {
      $scope.notesTextareaIsValid = true;      
    }
    $scope.resetMsgs(0);  
    // delete unused payload
    delete $scope.notesModel.companyId;
    delete $scope.notesModel.createTime;
    delete $scope.notesModel.updateTime;
    delete $scope.notesModel.submittedBy;
    delete $scope.notesModel.submittedName;
    delete $scope.notesModel.submittedUserRoleId;
    // delete unused payload
    if ($scope.notesTextareaIsValid) {      
      if ($scope.isCreateMode) $scope.isCustomerNotesCreating = true;     
      if ($scope.isUpdateMode) $scope.isCustomerNotesUpdating = true;
      if ($scope.isDeleteMode) $scope.isCustomerNotesDeleting = true;     
      apiGateWay.send("/customer_notes", $scope.notesModel).then(function(response) {
        if (response.data.status == 200) {
          let msg = '';
          if ($scope.isCreateMode) msg = 'added';
          if ($scope.isUpdateMode) msg = 'updated';
          if ($scope.isDeleteMode) msg = 'deleted';        
          $scope.customerNotesSuccess = 'Customer note ' + msg + ' successfully';
          $scope.apiParams.offset = 0;   
          $scope.getCustomerNotes();
          $scope.closeModifyCustomerNotesPopup();        
          $scope.notesModel = {};
          $scope.resetMsgs(); 
          $scope.readMoreEnabled = {};        
        } else {
          $scope.customerNotesError = 'Something went wrong. Please try again.'
        }
        $scope.isCustomerNotesCreating = $scope.isCustomerNotesUpdating = $scope.isCustomerNotesDeleting = false;
        $scope.resetMsgs(); 
      }, function(error) {
        $scope.isCustomerNotesCreating = $scope.isCustomerNotesUpdating = $scope.isCustomerNotesDeleting = false;
        $scope.customerNotesError = error
        $scope.resetMsgs(); 
      });
    }
  }
  $scope.resetMsgs = (timeout=2000) => {
    if ($scope._timeout) {
      $timeout.cancel($scope._timeout)
    }
    $scope._timeout = $timeout(function() {
      $scope.customerNotesSuccess = $scope.customerNotesError = '';
    }, timeout)
  }
  $scope.canDeleteNote = (item) => {
    if ($scope.canDeleteOtherCustomerNotes) {
      return true
    }
    if ($scope.isSuperAdmin) {
      return true
    }
    if (item.submittedBy === $scope.userId) {
      return true
    }
    return false
  }
  $scope.canEditNote = (item) => { 
    if (item.submittedUserRoleId === 0 && item.submittedBy === session.id) {
      return true
    }              
    if (item.submittedBy === $scope.userId) {
      return true
    }
    return false
  }
  $scope.setMode = (mode) => {
    $scope.isCreateMode = false;
    $scope.isUpdateMode = false;
    $scope.isDeleteMode = false;
    if (mode === 'createMode') { $scope.isCreateMode = true; }
    if (mode === 'editMode') { $scope.isUpdateMode = true; }
    if (mode === 'deleteMode') { $scope.isDeleteMode = true; }
  }
  $scope.getSubmitButtonText = () => {
    let str = 'Ok';
    if ($scope.isCreateMode) { str = 'Save' }
    if ($scope.isUpdateMode) { str = 'Update' }
    if ($scope.isDeleteMode) { str = 'Delete' }
    if ($scope.isCustomerNotesCreating) { str = 'Creating' }
    if ($scope.isCustomerNotesUpdating) { str = 'Updating' }
    if ($scope.isCustomerNotesDeleting) { str = 'Deleting' }
    return str
  }
  $scope.getHeadingText = () => {
    let str = '';
    if ($scope.isCreateMode) { str = 'Add' }
    if ($scope.isUpdateMode) { str = 'Edit' }
    if ($scope.isDeleteMode) { str = 'Delete' }
    return str
  }
  $scope.getSubmitBtnClass = () => {
    let str = '--customer-note-btn';
    if ($scope.isCreateMode) { str = '--customer-note-add-btn' }
    if ($scope.isUpdateMode) { str = '--customer-note-add-btn' }
    if ($scope.isDeleteMode) { str = '--customer-note-delete-btn' }
    return str;
  }
  $scope.getNotesPopupClass = () => {
    let str = 'cnw-popup-style';
    if ($scope.isCreateMode) { str = 'cnw-popup-style-add' }
    if ($scope.isUpdateMode) { str = 'cnw-popup-style-edit' }
    if ($scope.isDeleteMode) { str = 'cnw-popup-style-delete' }
    return str;
  }
  $scope.notesModifying = () => {
    return $scope.isCustomerNotesCreating || $scope.isCustomerNotesUpdating || $scope.isCustomerNotesDeleting;
  }
  $scope.$on("$destroy", function () {
  });
});
