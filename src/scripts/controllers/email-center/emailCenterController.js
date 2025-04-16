angular.module('POOLAGENCY').controller('emailCenterController', function($scope, $scope, $timeout, apiGateWay, ngDialog, auth, getFroalaConfig, pendingRequests, configConstant) {
    // email center tabs
    let userSession = auth.getSession();
    $scope.ecpTabs = [
        { 
          key: 'groupEmails',
          title: 'Group Emails',
          templateName: 'group-email.html',
          accessible: true,
          permissionMessage: '',
        },
        { 
          key: 'automaticEmails',
          title: 'Automatic Emails',
          templateName: 'automatic-emails.html',
          accessible: userSession.canManageAutomaticEmailSettings || false,
          permissionMessage: 'You need permission to manage Automatic Emails',
        },
        { 
          key: 'sendHistory',
          title: 'Send History',
          templateName: 'send-history.html',
          accessible: true,
          permissionMessage: '',
        },
        { 
          key: 'suppressionList',
          title: 'Suppression List',
          templateName: 'suppression-list.html',
          accessible: true,
          permissionMessage: '',
        },
        { 
          key: 'templateList',
          title: 'Templates',
          templateName: 'email-templates.html',
          accessible: userSession.canManageEmailTemplates || false,
          permissionMessage: 'You need permission to manage Email Templates',
        },
      ];
      $scope.activeEcpTab = '';
      $scope.setEcpTab = function(tab) {
          $scope.activeEcpTab = tab.key
      };  
      $scope.setEcpTab($scope.ecpTabs[0]);
      // email center tabs
})