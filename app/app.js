var module = angular.module('wizard', ['ngRoute']);

module.config(function ($controllerProvider, $provide) {
    //Used to handle loading controllers dynamically
    module.controller = $controllerProvider.register;
    //    module.factory = $provide.factory;
    module.service = $provide.service;
});

//This configures the routes and associates each route with a view and a controller
module.config(['$routeProvider', '$locationProvider', '$httpProvider', function ($routeProvider, $locationProvider, $httpProvider) {

    //========================================================
    // check if the user is connected
    //========================================================
    var authenticated = function ($q, $timeout, $http, $location, $rootScope, callingURL) {
        // initialize a new promise

        ////==========================通过$q服务注册一个延迟对象 deferred, 在创建一个deferred实例时，也会创建出来一个派生的promise对象
        var deferred = $q.defer();
        //        var urldata = {
        //            originalUrl: $location.path()
        //        };
        //        callingURL.setCallingURL($location.path()); // save calling url
        //        console.log("setCallingURL:", callingURL.getOriginalURL());
        // make an ajax call to check if the user is logged in
        //================================从/check_login这里得到数据，放入user中===============================
        $http.get('/check_login').success(function (user) {
            // authenticated
            if (user != '0') {
                // timeout(defereed.resolve,0);
                if (angular.equals(user, $rootScope.authentication_id)) {
                    // same user already logged in
                } else {
                    console.log("diff user: ", user);
                    $rootScope.authentication_id = user;
                    $rootScope.$broadcast('user.authenticated');
                }
                deferred.resolve();         //==========================任务被成功执行
            } // not authenticated 
            else {
                $rootScope.message = 'Login required.';
                deferred.reject();
                window.location.replace('/sso/login');
            }
        });
        return deferred.promise;         //===================通过deferred延迟对象，可以得到一个承诺promise，而promise会返回当前任务的完成结果
    }

    var loggedOut = function ($q, $timeout, $http, $location, $rootScope) {
        var deferred = $q.defer();
        /*
                $q.all([
                $http.get("https://idaas.iam.ibm.com/pkmslogout"),
                $http.get("https://www-304.ibm.com/pkmslogout?_logrand=0.5632884121202146"),
                $http.get("https://www-947.ibm.com/pkmslogout?_logrand=0.5623708715014116"),
                $http.get("https://prepiam.toronto.ca.ibm.com/pkmslogout")]).then(function () {
                */
        $http.get('/sso/logout').success(function (rc) {
            deferred.resolve();
            $rootScope.authentication_id = '0';
            //            $rootScope.$broadcast('user.loggedout');
        });
        return deferred.promise;
    }

    var chkAuthentication = function ($q, $timeout, $http, $location, $rootScope) {
        var deferred = $q.defer();
        $http.get('/check_login').success(function (user) {
            // authenticated
            if (user != '0') {
                // timeout(defereed.resolve,0);
                if (angular.equals(user, $rootScope.authentication_id)) {
                    // same user already logged in
                } else {
                    console.log("diff user: ", user);
                    $rootScope.authentication_id = user;
                    $rootScope.$broadcast('user.authenticated');
                }
            }
            deferred.resolve();
        });
        return deferred.promise;
    }

    //========================================================
    // add an interceptor for AJAX errors
    //========================================================
    $httpProvider.interceptors.push(function ($q, $location) {
        return {
            response: function (response) {
                return response;
            },
            responsError: function (response) {
                if (response.status === 401)
                    window.location.replace('/sso/login');
                return $q.reject(response);
            }
        };
    });

    //========================================================
    // define all the routes，指定每个URL的依赖和控制器
    //========================================================
    $routeProvider
        .when('/', {
            templateUrl: '/app/partials/intro.html',
            //=============resolve该属性会以键值对对象的形式，给路由相关的控制器绑定服务或者值。然后把执行的结果值或者对应的服务引用，注入到控制器中。
            resolve: {
                loggedin: chkAuthentication,
            }
        })
        .when('/redirect', {
            controller: function (callingURL, $location, $rootScope) {
                var prevcallingURL = $rootScope.callingURL ? $rootScope.callingURL : '/startMigration';
                //                var prevcallingURL = callingURL.getOriginalURL() || '/startMigration';
                console.log("sso redirection to: ", prevcallingURL);
                $location.path(prevcallingURL);
            },
            template: ""
        })
        .when('/newMigration', {
            resolve: {
                loggedin: authenticated,
                myData: function (UserData) {
                    return UserData.deleteProgress();
                }
            },
            controller: function (UserData, $location) {
                //==========获取当前url的子路径(也就是当前url#后面的内容,不包括参数):
                $location.path("/migration/select-migration-target");
                //                $location.path("/startMigration");
            },
            template: ""
        })
        .when('/startMigration', {
            resolve: {
  //              loggedin: authenticated,
                //我猜 myData是指返回的数据，并注入控制器中
                myData: function (UserData) {
                    return UserData.getProgress;
                }
            },
            controller: function (UserData, $location) {
                var page = UserData.getMigrationStep();
                console.log("redirecting to: ", page);
                $location.path(page);
            },
            template: ""
        })
        .when('/migration/:slug', {
            controller: 'migrationController',
            templateUrl: '/app/partials/migrationPages.html',
            resolve: {
                loggedin: authenticated,
            }
        })
        .when('/migration-info/:slug', {
            controller: 'migrationInfoController',
            templateUrl: '/app/partials/mainPages.html',
        })
        .when('/logout', {
            resolve: {
                saveData: function (UserData) {
                    UserData.saveProgress();
                },
                loggedout: loggedOut
            },
            templateUrl: '/app/partials/logout.html',
        })
        .otherwise({
            redirectTo: '/'
        });

    $locationProvider.html5Mode(true);
                }]);




module.run(['$rootScope', '$http', function ($rootScope, $http) {
    $rootScope.message = '';
    // Logout function is available in any pages
    $rootScope.logout = function () {
        $rootScope.message = 'Logged out.';
        $http.get('/logout');
    };
}]);

// * can we setup a call to UserData.saveProgress() occasionally and for specific routes eg. logout ??
