﻿(function (window, undefined) {

    var API_ENDPOINT = 'http://localhost:30777/api/values';
    var AUTHORIZATION_ENDPOINT = 'http://localhost:30777/OAuth/Authorise';
    var CLIENT_ID = 'samplewebapiconsumer';

    var oAuthClientDemo = function () {
        var base = this;
        base.options = {};
        base.elements = {
            serverFetchID: '#ServerFetch',
            getValuesButtonID: '#GetValuesButton',
            outputElementID: '#Output'
        };
        base.resourceURI = API_ENDPOINT;
        base.requiresAuth = false;
        base.accessToken = null;

        base.init = function () {
            $.support.cors = true; // force cross-site scripting (as of jQuery 1.5)
            $(base.elements.getValuesButtonID).click(function () {
                if ($(base.elements.serverFetchID).is(':checked')) {

                    base.onServerGetValues();
                } else {
                    base.onClientGetValues();
                }
            });
            base.checkAuth();
        };

        /*
        Checks whether we have been through the loop and already have an access token.
        */
        base.checkAuth = function () {

            var fragmentIndex = document.location.href.indexOf('#');
            if (fragmentIndex > 0) {
                var fragment = document.location.href.substring(fragmentIndex + 1);
                var args = base.utilities.parseQueryString(fragment);
                if (args['access_token']) {
                    base.accessToken = args['access_token'];
                }
                $(base.elements.serverFetchID).removeAttr('checked');
                base.getValues();
            } else {
                base.requiresAuth = true;
            }
        };

        /*
        Does a client redirect to authorize a request and get an acccess token that can be used again and again.
        */
        base.onClientGetValues = function () {

            if (base.requiresAuth) {
                var args = new Array();
                args['scope'] = base.resourceURI;
                args['redirect_uri'] = base.utilities.stripQueryAndFragment(document.location.href);
                args['response_type'] = 'token';
                args['client_id'] = CLIENT_ID;

                var authoriseUrl = AUTHORIZATION_ENDPOINT + base.utilities.assembleQueryString(args);
                window.location = authoriseUrl;
            } else {
                base.getValues();
            }
        };

        /*
        Makes the actual request to the resource server to get some data.
        */
        base.getValues = function () {
            $.support.cors = true;
            $.ajax({
                url: base.resourceURI,
                headers: {
                    "Authorization": "Bearer " + base.accessToken
                },
                success: function (data, textStatus, jqXHR) {
                    $(base.elements.outputElementID).text(data.toString());
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    $(base.elements.outputElementID).text(textStatus + ": " + errorThrown);
                }
            });
        };

        /*
        This uses server redirection, gets a code that can be used to make one time calls.
        */
        base.onServerGetValues = function () {

            $.ajax({
                type: 'POST',
                url: base.options.GetValuesURI,
                success: onSuccess,
                cache: false,
                dataType: 'JSON'
            });
            function onSuccess(data, textStatus, jqXHR) {
                if (data == null || !data.OK) {
                    alert("Something went wrong");
                    return;
                }

                if (data.RequiresAuth) {
                    window.location = data.RedirectURL;
                    return;
                }
                base.displayValues(data.Values);
            }
        };

        base.displayValues = function (data) {
            if (data == null)
                return;
            $(base.elements.outputElementID).text(data);
        };

        base.Setup = function (options) {
            base.options = $.extend({}, base.options, options);
        };

        base.utilities = {
            assembleQueryString: function (args) {
                var query = '?';
                for (var key in args) {
                    if (query.length > 1) query += '&';
                    query += encodeURIComponent(key) + '=' + encodeURIComponent(args[key])
                };
                return query;
            },

            parseQueryString: function (query) {
                var result = new Array();
                var pairs = query.split('&');
                for (var i = 0; i < pairs.length; i++) {
                    var pair = pairs[i].split('=');
                    var key = decodeURIComponent(pair[0]);
                    var value = decodeURIComponent(pair[1]);
                    result[key] = value;
                };
                return result;
            },

            stripQueryAndFragment: function (url) {
                var index = url.indexOf('?');
                if (index < 0) index = url.indexOf('#');
                url = index < 0 ? url : url.substring(0, index);
                return url;
            }
        };

        base.init();
    };

    window.DNOA = window.DNOA || {};
    window.DNOA.OAuth = window.DNOA.OAuth || {};
    window.DNOA.OAuth.Client = new oAuthClientDemo();

})(window);