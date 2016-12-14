const kinveyBaseUrl = "https://baas.kinvey.com/";
const kinveyAppID = "kid_HkKm7F9Qe";
const kinveyAppSecret =
    "7cedc6edbd7d474fbef4fc2f375054cf";
const kinveyAppAuthHeaders = {
    'Authorization': "Basic " +
    btoa(kinveyAppID + ":" + kinveyAppSecret),
};

function startApp() {
    sessionStorage.clear(); // Clear user auth data
    showHideMenuLinks();
    showHomeView();
    // Bind the navigation menu links
    $("#linkMenuAppHome").click(showHomeView);
    $("#linkMenuLogin").click(showLoginView);
    $("#linkMenuRegister").click(showRegisterView);
    $("#linkMenuUserHome").click(showUserHomeView);
    $("#linkMenuMyMessages").click(listMyMessages);
    $("#linkMenuSendMessage").click(showSendMessageView);
    $("#linkMenuArchiveSent").click(listSentMessages);
    $("#linkMenuLogout").click(logoutUser);

    // Bind the form submit buttons
    $("#buttonLoginUser").click(loginUser);
    $("#buttonRegisterUser").click(registerUser);
    $("#buttonMessageSend").click(createMsg);


    //MyHome Links
    $("#linkUserHomeMyMessages").click(listMyMessages);
    $("#linkUserHomeSendMessage").click(showSendMessageView);
    $("#linkUserHomeArchiveSent").click(listSentMessages);

    $("#infoBox, #errorBox").click(function () {
        $(this).fadeOut();
    });

    $(document).on({
        ajaxStart: function () {
            $("#loadingBox").show()
        },
        ajaxStop: function () {
            $("#loadingBox").hide()
        }
    });

    function showHideMenuLinks() {
        $("#linkMenuAppHome").show();
        if (sessionStorage.getItem('authToken')) {
            // We have logged in user
            $("#linkMenuLogin").hide();
            $("#linkMenuRegister").hide();
            $("#linkMenuUserHome").show();
            $("#linkMenuMyMessages").show();
            $("#linkMenuSendMessage").show();
            $("#linkMenuArchiveSent").show();
            $("#linkMenuLogout").show();
        } else {
            // No logged in user
            $("#linkMenuLogin").show();
            $("#linkMenuRegister").show();
            $("#linkMenuUserHome").hide();
            $("#linkMenuMyMessages").hide();
            $("#linkMenuSendMessage").hide();
            $("#linkMenuArchiveSent").hide();
            $("#linkMenuLogout").hide();
        }
    }

    function showInfo(message) {
        $('#infoBox').text(message);
        $('#infoBox').show();
        setTimeout(function () {
            $('#infoBox').fadeOut();
        }, 3000);
    }

    function showError(errorMsg) {
        $('#errorBox').text("Error: " + errorMsg);
        $('#errorBox').show();
    }

    function showView(viewName) {
        $('main > section').hide();
        $('#' + viewName).show();
    }

    function showHomeView() {
        showView('viewAppHome');
    }


    function showLoginView() {
        showView('viewLogin');
        $('#formLogin').trigger('reset');
    }

    function showRegisterView() {
        $('#formRegister').trigger('reset');
        showView('viewRegister');
    }

    function showUserHomeView() {
        showView('viewUserHome');
    }

    function showSendMessageView() {
        $('#formSendMessage').trigger('reset');
        loadUsernamesAsOptions();
        showView('viewSendMessage');
    }

    function showArchive() {
        showView('viewArchiveSent');
    }

    function logoutUser() {
        sessionStorage.clear();
        showHideMenuLinks();
        $('#spanMenuLoggedInUser').text('');
        showInfo('Logout successful.');
        showHomeView();
    }

    function loadUsernamesAsOptions() {
        $('#msgRecipientUsername').empty();
        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "user/" + kinveyAppID,
            headers: getKinveyUserAuthHeaders(),
            success: loadUsersSuccess,
            error: handleAjaxError
        });

        function loadUsersSuccess(response) {
            for(let user of response){
                let option = $('<option/>');
                option.attr({ 'value': user.username }).text(user.name);
                $('#msgRecipientUsername').append(option);
            }
        }
    }
    function listMyMessages() {
        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppID + "/Messages/",
            headers: getKinveyUserAuthHeaders(),
            success: loadMsgsSuccess,
            error: handleAjaxError
        });

        function loadMsgsSuccess(response) {
            $('#myMessages').empty();
            let currentLoggedInUserMsgs=[];
            for(let message of response){
                if(message.recipient_username==sessionStorage.getItem('username')){
                    currentLoggedInUserMsgs.push(message);
                }
            }
            console.log(currentLoggedInUserMsgs);
            if (currentLoggedInUserMsgs.length == 0) {
                showInfo('No messages in database.');
            } else {
                let messagesTable = $('<table>')
                    .append($('<tr>').append(
                        '<th>To</th><th>Message</th>',
                        '<th>Date Received</th>'));
                for (let message of currentLoggedInUserMsgs){
                    appendBookRow(message, messagesTable);
                }
                $('#myMessages').append(messagesTable);
                function appendBookRow(message, messagesTable) {
                    let links = [];
                    // TODO: action links will come later
                    messagesTable.append($('<tr>').append(
                        $('<td>').text(message.sender_name),
                        $('<td>').text(message.text),
                        $('<td>').text(formatDate(message._kmd.ect))
                    ));
                }
            }
            showView('viewMyMessages');
        }
    }

    function listSentMessages(){
        $('#sentMessages').empty();
        $.ajax({
            method: "GET",
            url: kinveyBaseUrl + "appdata/" + kinveyAppID + "/Messages/",
            headers: getKinveyUserAuthHeaders(),
            success: loadSentMsgsSuccess,
            error: handleAjaxError
        });
        function loadSentMsgsSuccess(response) {
            let currentLoggedInUserMsgs=[];
            for(let message of response){
                if(message.sender_name==sessionStorage.getItem('name')){
                    currentLoggedInUserMsgs.push(message);
                }
            }
            if (currentLoggedInUserMsgs.length == 0) {
                showInfo('No messages in database.');
            } else {
                let messagesTable = $('<table>')
                    .append($('<tr>').append(
                        '<th>To</th><th>Message</th>',
                        '<th>Date Sent</th><th>Actions</th>'));
                for (let message of currentLoggedInUserMsgs){
                    appendBookRow(message, messagesTable);
                }
                $('#sentMessages').append(messagesTable);
                function appendBookRow(message, messagesTable) {
                    let deleteLink = $('<a href="#">[Delete]</a>')
                        .click(function () { deleteMessage(message) });
                    messagesTable.append($('<tr>').append(
                        $('<td>').text(message.recipient_username),
                        $('<td>').text(message.text),
                        $('<td>').text(formatDate(message._kmd.ect)),
                        $('<td>').append(deleteLink)
                    ));
                }
            }
            showArchive();
        }

    }

    function deleteMessage(message) {
        $.ajax({
            method: "DELETE",
            url: kinveyMessageUrl = kinveyBaseUrl + "appdata/" +
                kinveyAppID + "/Messages/" + message._id,
            headers: getKinveyUserAuthHeaders(),
            success: deleteMessageSuccess,
            error: handleAjaxError
        });
        function deleteMessageSuccess(response) {
            listSentMessages();
            showInfo('Message deleted.');
        }
    }


    function createMsg(e) {
        e.preventDefault();
        let msgData = {
            recipient_username: $('#msgRecipientUsername').val(),
            text: $('#msgText').val(),
            sender_username: sessionStorage.getItem('username'),
            sender_name: sessionStorage.getItem('name'),
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "appdata/" + kinveyAppID + "/Messages",
            headers: getKinveyUserAuthHeaders(),
            data: msgData,
            success: createMsgSuccess,
            error: handleAjaxError
        });


        function createMsgSuccess(response) {
            showInfo('Message created');
            listSentMessages();
        }
    }

    function loginUser(e) {
        e.preventDefault();
        let userData = {
            username: $('#loginUsername').val(),
            password: $('#loginPasswd').val(),
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppID + "/login",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: loginSuccess,
            error: handleAjaxError
        });
        function loginSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showInfo('Login successful.');
            showUserHomeView();
        }
    }

    function registerUser(e) {
        e.preventDefault();
        let userData = {
            username: $('#registerUsername').val(),
            password: $('#registerPasswd').val(),
            name: $('#registerName').val()
        };
        $.ajax({
            method: "POST",
            url: kinveyBaseUrl + "user/" + kinveyAppID + "/",
            headers: kinveyAppAuthHeaders,
            data: userData,
            success: registerSuccess,
            error: handleAjaxError
        });
        function registerSuccess(userInfo) {
            saveAuthInSession(userInfo);
            showHideMenuLinks();
            showInfo('User registration successful.');
            showUserHomeView();
        }
    }

        function saveAuthInSession(userInfo) {
            let userAuth = userInfo._kmd.authtoken;
            sessionStorage.setItem('authToken', userAuth);
            let userId = userInfo._id;
            sessionStorage.setItem('userId', userId);
            let username = userInfo.username;
            sessionStorage.setItem('username', username);
            let name = userInfo.name;
            sessionStorage.setItem('name', name);
            $('#spanMenuLoggedInUser').text(
                "Welcome, " + username + "!");
        }

        function handleAjaxError(response) {
            let errorMsg = JSON.stringify(response);
            if (response.readyState === 0)
                errorMsg = "Cannot connect due to network error.";
            if (response.responseJSON &&
                response.responseJSON.description)
                errorMsg = response.responseJSON.description;
            showError(errorMsg);
        }

        function getKinveyUserAuthHeaders() {
            return {
                'Authorization': "Kinvey " +
                sessionStorage.getItem('authToken'),
            };
        }

    function formatDate(dateISO8601) {
        let date = new Date(dateISO8601);
        if (Number.isNaN(date.getDate()))
            return '';
        return date.getDate() + '.' + padZeros(date.getMonth() + 1) +
            "." + date.getFullYear() + ' ' + date.getHours() + ':' +
            padZeros(date.getMinutes()) + ':' + padZeros(date.getSeconds());

        function padZeros(num) {
            return ('0' + num).slice(-2);
        }
    }

}


