window.onload = function() {
    var content_width = window.innerWidth;
    var content = document.getElementsByClassName("content")[0];
    content.style.width = (content_width-200)+"px";
    getAlbums();
    addAlbum();   
}
/*
 *重置相册导航的样式
 */
function reset() {
    var album_name = document.getElementById("album-name");
    album_name.value="";
    album_name.placeholder = "请输入相册名字";
    album_name.style.border = "1px solid #fff";
    var password = document.getElementById("password");
    password.value = "";
    password.placeholder = "请输入管理密码";
    password.style.border = "1px solid #fff";
}
/*
 *如果该函数被调用时存在实参，则说明是addAlbum 后台传回的信息,需要按信息进行提示
 *否则则直接ajax向后台拉取相册信息
 */
function getAlbums(xr) {
    if(xr) {
        var album_name = document.getElementById("album-name");
        var password = document.getElementById("password");
        if( xr.responseText === "NAME_NULL" ) {           //后台传回"NAME_NULL"表示没有填写相册名字
            album_name.style.border = "1px solid red";
            album_name.placeholder = "名字不能为空";
        }else if( xr.responseText === "PWD_ERROR" ) {
            password.style.border = "1px solid red";
            password.value="";
            password.placeholder = "密码错误";
        }else if( xr.responseText === "DISTINCT_NAME") {
            album_name.style.border = "1px solid red";
            album_name.placeholder = "名字与现有相册重复";
        }else if( xr.responseText === "INPUT_OK") {         //如果传回"INPUT_OK"，表示相册创建成功，隐藏新建相册div，展示按钮
            album_name.style.border = "1px solid #fff";
            album_name.placeholder = "在这里输入相册名字";
            document.getElementById("add-box").style.display = "none";
            document.getElementById("add-album").style.display = "block";
            //将输入框置为空
            album_name.value = "";
            password.value = "";
        }
    }
    ajax("../server/getAlbum.php",{
        onsuccess: function(xhr) {
            var albums_ul = document.getElementById("albums");
            //每次拉取相册信息前重置相册列表
            albums_ul.innerHTML = "<li>全部&nbsp;&nbsp;(<span id=\"all-num\" class=\"num\"></span>)</li>"
            var all_num = 0;
            if(xhr.responseText) {
                var fragment = document.createDocumentFragment();
                var recive = JSON.parse(xhr.responseText);
                for( var i=0;i<recive.length;i++ ) {
                    var tmp =  JSON.parse(recive[i]);
                    var album_li = document.createElement("li");
                    all_num += parseInt(tmp.num);

                    album_li.innerHTML = tmp.name+"&nbsp;&nbsp;(<span class=\"num\">&nbsp;"+tmp.num+"&nbsp;</span>)<img class=\"edit-btn\" src=\"../src/pen.png\"><img class=\"del-btn\" src=\"../src/del.png\">";
                    EventUtil.addHandler(album_li,"click",showPhotos);
                    fragment.appendChild(album_li);
                }
                albums_ul.appendChild(fragment);
            }
            document.getElementById("all-num").innerHTML = "&nbsp;"+all_num+"&nbsp;";
            showPhotos("ALL");
            albumDeal();   //必须在相册信息拉取完之后才能执行albumDeal
        }
    });  
}

/*
 *点击添加相册按钮，触发该事件函数
 *展示新建相册div，隐藏按钮，重置所有样式
 *检查输入内容是否合法，提交所填数据到server之后，由getaAlbums函数处理
 */
function addAlbum() {
    var add_btn = document.getElementById("add-album");
    EventUtil.addHandler(add_btn,"click",function() {
        reset();
        add_btn.style.display = "none";
        var add_box = document.getElementById("add-box");
        add_box.style.display = "block";

        var album_name = document.getElementById("album-name");
        var com_btn = document.getElementById("com-btn");
        var cancel_btn = document.getElementById("cancel-btn");
        EventUtil.addHandler(com_btn,"click",function() {     
            name = trim(album_name.value);
            var re = /^\s*$/;
            if(re.test(name)) {
                album_name.value = "请不要包含任何空白字符";
                album_name.style.border = "1px solid red";
            }else {
                ajax("../server/addAlbum.php",{
                    "type": 'POST',
                    "data": "album="+name+"&pwd="+password.value,
                    "onsuccess": getAlbums
                });
            }
        });

        EventUtil.addHandler(cancel_btn,"click",function() {
            add_box.style.display = "none";
            add_btn.style.display = "block";
        })
    });
}
/*
 *给每一个相册绑定事件
 */
 function albumDeal() {
    var albums = document.getElementById("albums");
    var albums_list = albums.getElementsByTagName("li");

    for(var i=1,len=albums_list.length;i<len;i++) {
        EventUtil.addHandler(albums_list[i],"mouseover",function(ev) {
            var over_li = EventUtil.getTarget(ev);
            if(over_li.nodeName.toLowerCase() !== "li") {
                over_li = over_li.parentNode;
            }
            addClass(over_li,"active");
            var edit_btn = over_li.getElementsByTagName("img")[0];
            var del_btn = over_li.getElementsByTagName("img")[1];
            edit_btn.style.display = "inline";
            del_btn.style.display = "inline";
            EventUtil.addHandler(edit_btn,"click",editAlbum);
            EventUtil.addHandler(del_btn,"click",delAlbum);
        });
        EventUtil.addHandler(albums_list[i],"mouseout",function(ev) {
            var out_li = EventUtil.getTarget(ev);
            if(out_li.nodeName.toLowerCase() !== "li") {
                out_li = out_li.parentNode;
            }
            removeClass(out_li,"active");
            if( out_li.getElementsByTagName("img") ) {
                out_li.getElementsByTagName("img")[0].style.display = "none";
                out_li.getElementsByTagName("img")[1].style.display = "none";
            }
        });
    }
}

/*
 *从this对象中提取出相册名字，展现编辑框，隐藏按钮
 *为按钮绑定事件，需要密码才能进行确认修改
 */
function editAlbum() {
    var re = /(^[\u4E00-\u9FA5\uF900-\uFA2D]+|\w+)&/;
    if( re.test(this.parentNode.innerHTML) ) {
        var pri_name = RegExp.$1;
    }
    var add_btn = document.getElementById("add-album");
    add_btn.style.display = "none";
    var add_box = document.getElementById("add-box");
    add_box.style.display = "block";
    var change_link = add_box.getElementsByTagName("a")[0];
    change_link.style.display = "inline";   
    document.getElementById("add-head").innerHTML = "修改相册";
    var album_name = document.getElementById("album-name");
    album_name.value = pri_name;

    var com_btn = document.getElementById("com-btn");
    var cancel_btn = document.getElementById("cancel-btn");
    var new_pwd = document.getElementById("new-pwd");
    EventUtil.addHandler(change_link,"click",function(ev) {
        EventUtil.preventDefault(ev);
        change_link.style.display = "none"; 
        new_pwd.style.display = "block";
    });
    EventUtil.addHandler(cancel_btn,"click",function() {
        add_box.style.display = "none";
        add_btn.style.display = "block";
        change_link.style.display = "none";
    });
    EventUtil.addHandler(com_btn,"click",function() {
        change_link.style.display = "none";
        ajax("../server/updateAlbum.php",{
            "type": 'POST',
            "data": "pri_name="+pri_name+"&new_name="+album_name.value+"&pri_pwd="
            +document.getElementById("password").value+"&new_pwd="+new_pwd.value,
            "onsuccess": getAlbums
        });
    });
}
/*
 *删除相册
 */
function delAlbum() {
    var re = /(^[\u4E00-\u9FA5\uF900-\uFA2D]+|\w+)&/;
    if( re.test(this.parentNode.innerHTML) ) {
        var pri_name = RegExp.$1;
    }
    var password = document.getElementById("del-pwd");
    password.value = "";
    password.style.borderColor = "#fff";
    password.placeholder = "请输入相册管理密码";
    var del_div = document.getElementById("del-div");
    del_div.style.display = "block";

    var del_btn = document.getElementById("del-btn");
    var del_cancel = document.getElementById("del-cancel");
    EventUtil.addHandler(del_btn,"click",function() {
        ajax("../server/updateAlbum.php",{
            "type": "POST",
            "data": "pri_name="+pri_name+"&pri_pwd="+password.value+"&type=delete",
            onsuccess: function(xhr) {
                if(xhr.responseText === "PWD_ERROR") {
                    password.value = "";
                    password.placeholder = "密码错误";
                    password.style.borderColor = "red";
                } else if(xhr.responseText === "INPUT_OK") {
                    del_div.style.display = "none";
                    getAlbums();
                }
            }
        })
    });
    EventUtil.addHandler(del_cancel,"click",function() {
        del_div.style.display = "none";
    });
}

function showPhotos(name) {
    var last_album = document.getElementsByClassName("album_bg")[0];
    var uploader = document.getElementById("wrapper");
    uploader.style.display = "none";
    if(last_album) {     //清除上一次选中相册的高亮背景
        removeClass(last_album,"album_bg");
    }

    var up_img = document.getElementById("up-img");   
    //如果是展示全部图片，则相册列表-“全部”高亮，导入图片区域隐藏
    if(name === "ALL") {   
        var pri_name = "ALL";
        var albums = document.getElementById("albums");
        album_all = albums.getElementsByTagName("li")[0];
        EventUtil.addHandler(album_all,"click",function() {
            showPhotos("ALL");
        });
        addClass(album_all,"album_bg");
        up_img.style.display = "none";
    }else {     //否则，当前选中相册背景高亮，显示出导入图片按钮
        var this_album = this;
        addClass(this_album,"album_bg");
        up_img.style.display = "block";

        var re = /(^[\u4E00-\u9FA5\uF900-\uFA2D]+|\w+)&/;
        if( re.test(this_album.innerHTML) ) {
            var pri_name = RegExp.$1;
        }
        
        var up_btn = document.getElementById("up-btn");
        EventUtil.addHandler(up_btn,"click",function() {
            this_album = document.getElementsByClassName("album_bg")[0];
            if( re.test(this_album.innerHTML) ) {
                var pri_name = RegExp.$1;
            }
            uploader.style.display = "block";
            console.log(pri_name);
            getToken({
                "name": pri_name,
                "container": this_album
            });
        });
    }
    //重置content区域
    var img_show = document.getElementById("img-show");
    img_show.innerHTML = "";
    ajax("../server/getPhotos.php",{
        "type": "POST",
        "data": "name="+pri_name,
        onsuccess: function(xhr) {
            if(xhr.responseText) {
                var fragment = document.createDocumentFragment();
                var recive = JSON.parse(xhr.responseText);
                for( var i=0;i<recive.length;i++ ) {
                    var tmp = JSON.parse(recive[i]);
                    var img_box = document.createElement("div");
                    img_box.className = "img-box";
                    img_box.innerHTML = "<img src="+tmp.src+">"+"<span class=\"item-name\">"+tmp.name+"</span>"
                                        +"<img class=\"edit-items\" src=\"../src/ellips.png\">";
                    fragment.appendChild(img_box);
                }
                img_show.appendChild(fragment);
            }
        }
    });
}