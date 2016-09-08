module.controller('authenticationController', ['$scope', '$rootScope', '$route', 'UserData', function ($scope, $rootScope, $route, UserData) {

    $scope.browser_message = "We have detected that you are using Internet Explorer.  Due to limitations with Internet Explorer, it is highly recommended that you navigate this site with  Chrome, Firefox, or Safari.";
    // check if supported on Chrome 1+
    //    $scope.isChrome = !!window.chrome && !!window.chrome.webstore;
    // Check if it is Internet Explorer 6-11
    $scope.isIE = /*@cc_on!@*/ false || !!document.documentMode;

    $scope.lastPage = "/startMigration";

    //$on：监听或接收数据。用于接收event与data
    $scope.$on('migrationStep.update', function () {
        $scope.lastPage = UserData.getMigrationStep();
    });

//    $scope.authenticated = $rootScope.authentication_id;

//    $scope.$on('user.authenticated', function () {
//        console.log("authenticationController: authenticated : ", $rootScope.authentication_id);
//        $scope.authenticated = $rootScope.authentication_id;
//        $scope.authenticated_user = $rootScope.authentication_id.displayName ? $rootScope.authentication_id.displayName : $rootScope.authentication_id.id;
//    });
//
    }]);

module.controller('migrationTarget', ['$location', '$scope', 'UserData', function ($location, $scope, UserData) {

    $scope.migrationTargets = UserData.getMigrationTargets();
    $scope.target = {
        version: UserData.getUserMigrationTarget()
    };

    $scope.setUserMigrationTarget = function (target) {
        UserData.setUserMigrationTarget($scope.target.version);
        $scope.stepCompleted(target, $scope.target.version);
    };
}]);

module.controller('migrationInfoController', ['$location', '$routeParams', '$scope', 'UserData', '$rootScope', '$http', '$interval', function ($location, $routeParams, $scope, UserData, $rootScope, $http, $interval) {

    var slug = $routeParams.slug;
    var msg = UserData.pageTitles[slug];

    $scope.migrationMessage = msg;
    $scope.templateUrl = '/app/partials/' + slug + '.html';

    console.log("migrationMessage", msg, slug, $scope.templateUrl);

}]);


module.controller('migrationController', ['$location', '$routeParams', '$scope', 'UserData', '$rootScope', '$http', '$interval', function ($location, $routeParams, $scope, UserData, $rootScope, $http, $interval) {

    var slug = $routeParams.slug;
    var page = UserData.getMigrationInstructionPage(slug);
    $scope.doclinks = UserData.getUserDocumentationLinks();
    $scope.steps = UserData.getMigrationInstructionPages();
    //    $interval(UserData.saveProgress, 30000); // This is time period in milliseconds 1000 ms = 1 second, save every 30seconds

    /* handle broadcasts */
    $scope.$on('userMigrationTarget.update', function () {
        $scope.doclinks = UserData.getUserDocumentationLinks();
        console.log("target %s: ", UserData.getUserMigrationTarget(), $scope.doclinks['V370srcUpgrade']);
    });
    $scope.$on('migrationStatus.update', function () {
        $scope.steps = UserData.getMigrationInstructionPages();
        console.log("migrationController: userName : ", $rootScope.authentication_id.id);
    });
    // end of broadcast handlers
    UserData.setLinkActive(slug);

    $scope.templateUrl = page.url;
    $scope.title = page.step + '. ' + page.title;
    $scope.response = page.response;



    //========data-ng-click="stepCompleted('No PDS load libraries', 'no')''======//
    $scope.stepCompleted = function (status, response) {

        console.log("saving response: ", response);
        UserData.updateStatus(slug, status, response);

        // identify and go to next migration step
        var pageIndex = UserData.getIndex(slug);
        console.log("pageIndex =", pageIndex, $scope.steps);
        if (pageIndex !== null && (pageIndex + 1) < $scope.steps.length) {
            $location.path('/migration/' + $scope.steps[pageIndex + 1].slug);
        } else {
            $location.path('/migration-info/migration-complete');
        }
    };

    $scope.defectFound = function (response) {
        console.log("saving response: ", response);
        UserData.updateStatus(slug, "Possible defect", response);
        $location.path('/migration-info/possible-defect');
    }

}]);

module.controller('networkController', ['$scope', 'UserData', function ($scope, UserData) {

    $scope.checkList = UserData.getnetworkChecklists();
    if (!$scope.response) {
        $scope.response = {};
    }
    console.log("response:", $scope.response);
}]);

module.controller('migrationComplete', ['$rootScope', '$scope', '$location', 'UserData', 'callingURL', function ($rootScope, $scope, $location, UserData) {
    $scope.steps = UserData.getMigrationInstructionPages();
    var migrationVersion = UserData.getUserMigrationTarget();
    var migrationTargets = UserData.getMigrationTargets();

    $scope.migrationTarget = migrationTargets[migrationVersion];

    $scope.savURL = function (url) {
        //        callingURL.setCallingURL(url);
        $rootScope.callingURL = url;
    };

    $scope.migrationStatus = function (str) {
        if (angular.isObject(str)) {
            return JSON.stringify(str, null, 4);
        } else {
            return str;
        }
    };

    $scope.printDiv = function (divName) {
        var printContents = document.getElementById(divName).innerHTML;
        var popupWin = window.open('', '_blank', 'width=300,height=300');
        popupWin.document.open();
        popupWin.document.write('<html><head></head><body onload="window.print()">' + printContents + '</body></html>');
        //        popupWin.document.write('<html><head><link rel="stylesheet" href="/public/stylesheets/styles.css" /></head><body onload="window.print()">' + printContents + '</body></html>');
        popupWin.document.close();
    };

}]);

module.controller('migrationTargetController', ['$scope', 'UserData', function ($scope, UserData) {
    var migrationVersion = UserData.getUserMigrationTarget();
    var migrationTargets = UserData.getMigrationTargets();
    $scope.migrationTarget = migrationTargets[migrationVersion];
}]);
