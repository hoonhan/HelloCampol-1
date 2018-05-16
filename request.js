// ============== Configuration for DB ========== //
var config = {
    apiKey: "AIzaSyDtevJ9Ote_Blm4vxbTNjB4h9PIpZdXIs4",
    authDomain: "hellocampol-24cae.firebaseapp.com",
    databaseURL: "https://hellocampol-24cae.firebaseio.com",
    projectId: "hellocampol-24cae",
    storageBucket: "",
    messagingSenderId: "439081917926"
};
firebase.initializeApp(config);
var database = firebase.database();
// ============================================== //


$(document).ready(function () {

    // ====== Page Redirection Setting =======//
    $('#redir_request').click(function () {
        window.location.href = 'request.html';
    });

    $('#redir_compl').click(function () {
        window.location.href = 'completed.html';
    });

    $('#redir_notice').click(function () {
        window.location.href = 'cardnews.html';
    });

    $('#gohome').click(function () {
        window.location.href = 'index.html';
    })

    // ======= initialize variables ======= //
    ref = database.ref("TaskList");
    var task_left = [];
    var task_done = [];
    var task_trash = [];
    var marker_list = [];
    var deletecard;
    var deletingKey;
    var delete_index;
    $(".ui.active.centered.inline.text.loader").css("display", "none");


    // ======= Manipulate List Data ======= //
    var update_task = function () {
        document.getElementById('ulcontent').innerHTML = "";
        $(".ui.active.centered.inline.text.loader").css("display", "block");

        ref.once("value", function (snapshot) {
            if (snapshot.length == 0) {
                document.getElementById('ulcontent').innerHTML = "지금 당장 해야되는 일이 없군요! \n No works to do now!";
            }
            snapshot.forEach(function (child) {
                var child_value = child.val();
                var key = child.key;
                var coordinate = child_value.coordinate;
                var task = {"key": key, "payload": child_value}
                if (child_value.flag_done == 1) {
                    task_done.push(task);
                }
                else if (child_value.flag_done == 0) {
                    task_left.push(task);
                }
                else {
                    task_trash.push(task);
                }
            });
            redraw_task_left();
            redraw_marker_left();
        });
    };

    // ======= Card Drawing Part ======= //
    var redraw_task_left = function () {
        $(".ui.active.centered.inline.text.loader").css("display", "none");

        if (task_left.length == 0) {
            document.getElementById('ulcontent').innerHTML = "더 이상 할일이 없어요! \n No more Work!";
        }
        else {
            var template_danger = $("#task-left-template-danger").html();
            var template_repair = $("#task-left-template-repair").html();
            var template_living = $("#task-left-template-living").html();
            for (var i = 0; i < task_left.length; i++) {
                // === Drawing Task Bar === //
                var data = task_left[i].payload;
                var category = data.category;
                data["keyvalue"] = task_left[i].key;
                if (category == 'Danger') var taskbar = Mustache.render(template_danger, data);
                if (category == 'Repair') var taskbar = Mustache.render(template_repair, data);
                if (category == 'Living') var taskbar = Mustache.render(template_living, data);
                $("ul").append(taskbar);
            }
        }
        // var key = document.getElementById('cardnews').getAttribute('value');
        // console.log('get key', key);
    };

    var redraw_marker_left = function () {
        if (task_left.length > 0) {
            var bounds = new google.maps.LatLngBounds();
            for (var i = 0; i < marker_list.length; i++) {
                marker_list[i].setMap(null);
            }
            marker_list = [];

            for (var i = 0; i < task_left.length; i++) {
                var data = task_left[i].payload;

                // === Choosing IconColor === //
                var category = data.category;
                //console.log(category);
                if (category == 'Danger') var iconColor = "assets/marker-pin-google-red.png";
                if (category == 'Repair') var iconColor = "assets/marker-pin-google-blue.png";
                if (category == 'Living') var iconColor = "assets/marker-pin-google-yellow.png";
                //console.log(iconColor);

                // === Choosing Coordinate and make marker with given png === //
                var coordinate = data.coordinate;
                var marker_pos = {lat: coordinate[0], lng: coordinate[1]};
                var marker = new google.maps.Marker({
                    position: marker_pos,
                    map: map,
                    icon: iconColor
                });
                marker_list.push(marker);
                bounds.extend(marker.position)
            }
            map.fitBounds(bounds);
            if (map.getZoom() > 16) map.setZoom(15);
        }
    };


    update_task();


    $(document).on('click', "#finished", function () {
        deletecard = $(this).closest("li");
        deletingKey = deletecard.find("p").html();
        delete_index = deletecard.index();

        // === Update DB === //
        task_left.splice(delete_index, 1);
        marker_list[delete_index].setMap(null);
        marker_list.splice(delete_index, 1);
        ref.child(deletingKey).update({flag_done: 1});
        deletecard.remove();
    });

    $(document).on('click', "#trashed", function () {
        deletecard = $(this).closest("li");
        deletingKey = deletecard.find("p").html();
        delete_index = deletecard.index();
        $("#TempModal").css('display','block');
        $("#ModalBox").css('display', 'block');
    });

    $(document).on('click', ".DeleteRequest", function() {
        console.log("DeleteRequest censored");
        // === Update DB === //
        task_left.splice(delete_index, 1);
        marker_list[delete_index].setMap(null);
        marker_list.splice(delete_index, 1);
        ref.child(deletingKey).update({flag_done: -1});
        deletecard.remove();
        $("#TempModal").css('display','none');
        $("#ModalBox").css('display', 'none');
        if(task_left.length == 0){
            document.getElementById('ulcontent').innerHTML = "더 이상 할일이 없어요! \n No more Work!";
        }
    });

    $(document).on('click', ".CancelDelete", function(){
        $("#TempModal").css('display','none');
        $("#ModalBox").css('display', 'none');
    });

    $(document).on('click', "#expand_message", function() {
        var changing_card = $(this).closest("li");
        var variable_content = changing_card.find("#variable_content");
        var expand_message = changing_card.find("#expand_message");
        var delete_index = changing_card.index();

        if (variable_content.css("display") === "none") {
			 variable_content.show();
            expand_message.html("Hide" + "<i class='angle up icon'></i>")

            marker_list[delete_index].setAnimation(google.maps.Animation.BOUNCE);
        } else {
            variable_content.hide();
            expand_message.html("Show more" + "<i class='angle down icon'></i>");
            marker_list[delete_index].setAnimation(null);

        }
    })


});


