//Java Script
$(document).ready(() => {

    var type_page = sessionStorage.getItem('TYPE_PAGE');

    if (window.location.pathname == '/deliveryinfo'){
        $('#phone').inputmask("+7(999) 999-99-99");

        if (type_page == 'Pay-Instagramm'){
            var deliv = JSON.parse(sessionStorage.getItem('SHEETNAME'));
            var arrDeliv = JSON.parse(sessionStorage.getItem('PICKUP'));

            if (arrDeliv[deliv]){
                $('#r_5').show();
            }

            $('.body_block_b .row_block:eq(0)').hide();

        } else {
            $('.body_block_b .row_block:eq(0)').show();
        }

    } else if (window.location.pathname == '/'){
        $('#placeholder').css({
            "width": $('#nick_name').width(),
            "top": $('#nick_name').offset().top + $('#nick_name').height()+5,
            "left": $('#nick_name').offset().left
        });

        // ДЛЯ КОРЗИНЫ
        /*
        var products = {
            product:[]
        };

        $('.product').map((ss) => {
            var id = $(`.product:eq(${ss}) button`).attr('id');
            var name = $(`.product:eq(${ss}) h3`).text();
            var price = $(`.product:eq(${ss}) h2`).text();
            var photo = $(`.product:eq(${ss}) .block_foto img`).attr('src');
            var description = $(`.product:eq(${ss}) p.description`).text();
            var use = $(`.product:eq(${ss}) p.use`).text();;
            var measures = $(`.product:eq(${ss}) p.measures`).text();
            var storage = $(`.product:eq(${ss}) p.storage`).text();
            var composition = $(`.product:eq(${ss}) p.composition`).text();
            var manufacturer = $(`.product:eq(${ss}) p.manufacturer`).text();
            var organization = $(`.product:eq(${ss}) p.organization`).text();
            var number = $(`.product:eq(${ss}) p.number`).text();
            var date_save = $(`.product:eq(${ss}) p.date_save`).text();
            var manufactured_by = $(`.product:eq(${ss}) p.manufactured_by`).text();
            var valid_until = $(`.product:eq(${ss}) p.valid_until`).text();
            var volume = $(`.product:eq(${ss}) p.volume`).text();
            var code = $(`.product:eq(${ss}) p.code`).text();
            var full_name = $(`.product:eq(${ss}) p.full_name`).text();


            products.product.push({
                id,
                name,
                price,
                photo,
                description,
                use,
                measures,
                storage,
                composition,
                manufacturer,
                organization,
                number,
                date_save,
                manufactured_by,
                valid_until,
                volume,
                code,
                full_name
            })
        })

        sessionStorage.setItem('ALL_PRODUCTS', JSON.stringify(products));
        sessionStorage.setItem('SUMMA', 0);
        sessionStorage.removeItem('SHOP');
        */
    } else if (window.location.pathname.indexOf('/sucpayment')>=0){
        
        var params = window
        .location
        .search
        .replace('?','')
        .split('&')
        .reduce(
            function(p,e){
                var a = e.split('=');
                p[ decodeURIComponent(a[0])] = decodeURIComponent(a[1]);
                return p;
            },
            {}
        );

        var data = {
            orderId: params['orderId']
        }
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: '/sberstatus'
        }).done(data => {
            if (data.ok){
                if (data.data.actionCode == 0){
                    $('.container h1').text('Спасибо!');
                    $('.container h2').text(`Заказ № ${data.data.orderNumber} успешно оплачен.`);
                    $.ajax({
                        type: 'POST',
                        data: JSON.stringify({ numberOrder: data.data.orderNumber, type: type_page }),
                        contentType: 'application/json',
                        url: '/writedata'
                    }).done(data => {
                        if (!data.ok){
                            $('.container h4').text(`Произошла ошибка записи данных, обратитесь к администратору с НОМЕРОМ ЗАКАЗА и пометкой: "заказ оплачен, но данные не сохранены"!`);
                        }
                    });
                } else {
                    $('.container h1').text('ОШИБКА!');
                    $('.container h2').text(`Заказ № ${data.data.orderNumber} не оплачен. Повторите попытку.`);
                    $('.container h4').text('Причина отказа в оплате: ' + data.data.actionCodeDescription);
                }
            } else {
                alert('Сервер временно недоступен, попробуйте позже!');
            }
        });

    } else if (window.location.pathname == '/admin') {
        $.ajax({
            type: 'POST',
            url: '/adminproducts'
        }).done(data => {
            if (data.ok){

                var obj = {};
                var obj2 = {};

                for (var i=0; i < data.pr.length; i++){

                    var names = data.pr[i].name;
                    if (names.length > 30){
                        names = names.substr(0, 30) + ' ...';
                    }
                    var arrCol = data.pr[i].number;
                    var col = 0;
                    for (var x = 0; x < arrCol.length; x++){
                        col = col + Number(arrCol[x]);
                    }

                    $('#admin_table tbody').append(`
                    <tr>
                        <td hidden>${data.pr[i].id}</td>
                        <td>${data.pr[i].provider}</td>
                        <td title="${data.pr[i].name.replace(/"/g, "'")}">${names}</td>
                        <td>${col}</td>
                        <td>${data.pr[i].price} руб.</td>
                        <td>${data.pr[i].status}</td>
                    </tr>`);

                    obj[data.pr[i].provider] = true;
                    obj2[data.pr[i].status] = true;

                }

                Object.keys(obj).map(o => {
                    $('#filterProvider').append(`<option value="${o}">${o}</option>`);
                    $('#deletedProvider').append(`<option value="${o}">${o}</option>`);
                });
                Object.keys(obj2).map(o => {
                    $('#filterStatus').append(`<option value="${o}">${o}</option>`);
                });

                $('.load_data_admin').hide();

            } else {
                alert('Ошибочка, попробуйте позже!');
            }
        });
    } else if (window.location.pathname == '/shopping'){
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: '/allproducts'
        }).done(function(data){
            if (data.ok){

                var pr = data.pr;

                var provider = {};

                for(var r=0; r < data.pr.length; r+=4){
                    var row = `<div class="row_a">`;
                    var column = `<div class="column_a">`;
                    var product = '';
                    for (var c=r;c < r+2; c++) {
                        if (c < data.pr.length) {
                            provider[pr[c].provider] = true;
                            product += `
                            <div class="product"> 
                                <div class="block_foto"> 
                                    <img src="${pr[c].photo[0]}" alt=""> 
                                </div> 
                                <span class="brend">${pr[c].provider}</span> 
                                <p>${pr[c].name}</p> 
                                <span class="price">${pr[c].price} ₽</span> 
                                <button class="in_basket" id="${pr[c].id}">Подробнее</button> 
                            </div> 
                            `
                        } else {
                            break;
                        }
                    }
                    column += product + '</div>'
                    row += column;

                    column = `<div class="column_a">`;
                    product = '';

                    for (var c=r+2; c < r+4; c++){
                        if (c < data.pr.length) {
                            provider[pr[c].provider] = true;
                            product += `
                            <div class="product"> 
                                <div class="block_foto"> 
                                    <img src="${pr[c].photo[0]}" alt=""> 
                                </div> 
                                <span class="brend">${pr[c].provider}</span> 
                                <p>${pr[c].name}</p> 
                                <span class="price">${pr[c].price} ₽</span> 
                                <button class="in_basket" id="${pr[c].id}">Подробнее</button> 
                            </div> 
                            `
                        } else {
                            break;
                        }
                    }

                    column += product + '</div>'
                    row += column;

                    $('.products_block').append(row);

                }
                $('.filter_block ul').append(`<li id="active_provider">Все поставщики</li>`)
                $('#provider_li ul').append(`<li id="active_provider" class="prov_item_li">Все поставщики</li>`)
                Object.keys(provider).map(prov => {
                    $('.filter_block ul').append(`<li>${prov}</li>`);
                    $('#provider_li ul').append(`<li class="prov_item_li">${prov}</li>`)
                });

            } else {
                console.log(data);
            }
        });
        
    }

    var preload = () => {

        $.ajax({
            type: 'POST',
            url: '/preload'
        }).done(data => {
            if (data.ok){
                sessionStorage.setItem('nikName', JSON.stringify(data.data));
                $('.load_data').hide();
            } else {
                $('.load_data').hide();
                alert('Данные не загружены! Попробуйте позже...');
            }
        });
    };

    preload();
    
    var width = window.innerWidth;
    if (width < 530){
        $('.table_payment thead th:eq(0)').text('Название');
        $('.table_payment thead th:eq(1)').text('Ар-л');
        $('.table_payment thead th:eq(2)').text('Кол-во');
        $('.table_payment thead th:eq(3)').text('Руб');
    } else{
        $('.table_payment thead th:eq(0)').text('Название товара');
        $('.table_payment thead th:eq(1)').text('Артикул');
        $('.table_payment thead th:eq(2)').text('Количество');
        $('.table_payment thead th:eq(3)').text('Цена');
    }

    $(document).delegate( "#placeholder ul li", "click", (e) => {
        $('#nick_name').val(e.target.textContent);
        $('#placeholder').hide();
    })
    $('#nick_name').on('keyup', (e) => {

        var arr = JSON.parse(sessionStorage.getItem('nikName'));

        var text = $('#nick_name').val().toLowerCase();
        var len = text.length;

        if (text){
            $('#placeholder ul li').remove();

            var status = false;

            for (var i=0; i < arr.length; i++){
                if (arr[i].toLowerCase().substr(0, len) == text){
                    status = true;
                    $('#placeholder ul').append(`<li>${arr[i]}</li>`);
                }
            }
            if (status) $('#placeholder').show();
        } else {
            $('#placeholder').hide();
        }
    })
    $(document).delegate( "#sheet_name ul li", "click", (e) => {

        $('#sheet_name ul li').removeClass();

        if (e.target.className == 'active_sheet' && $('#sheet_name .active_sheet').length > 0){
            e.target.className = '';
        } else {
            e.target.className = 'active_sheet';
        }

        var arr = JSON.parse(sessionStorage.getItem('nikDATA'));

        var nameArr = $('#sheet_name .active_sheet');
        var summ = 0;
        var names = []

        $('.table_payment tbody tr').removeClass('active_tr');

        var arrPICKUP = JSON.parse(sessionStorage.getItem('PICKUP'));

        for (i=0; i < nameArr.length; i++){
            var name_r = $('#sheet_name .active_sheet:eq('+i+')').text();

            
            if (arrPICKUP[name_r] == undefined){
                names.push(name_r+'-самовывоз');
                var name = name_r+'-самовывоз';
                
            } else{
                names.push(name_r);
                var name = name_r;
            }

            try{
                var deliv = arr[name].delivery[0];
            } catch (e) {
                var name = String($('#sheet_name .active_sheet:eq('+i+')').text() +'-самовывоз');
                var deliv = arr[name].delivery[0];
            }

            for (var x=0; x < arr[name].name.length; x++){
                summ += +arr[name].price[x]
                var name_td = $('.table_payment tbody tr');
                name_td.map(ns => {
                    if ($('.table_payment tbody tr:eq('+ns+') td:last-child').text() == name){
                        $('.table_payment tbody tr:eq('+ns+')').addClass('active_tr');
                    }
                    //console.log($('.table_payment tbody tr:eq('+ns+') td:last-child').text());
                });
            }
        }

        sessionStorage.setItem('DELIVERY_SUM_MAIN', JSON.stringify(deliv));

        $('.table_payment tfoot tr td:eq(1)').text(summ + ' ₽');
        sessionStorage.setItem('SUMMA', summ);
        sessionStorage.setItem('SHEETNAME', JSON.stringify(names));

    });

    $('#to_delivery').on('click', () => {
        if($('.active_sheet').length > 0){
            sessionStorage.setItem('TYPE_PAGE', 'Pay-Instagramm');
            window.location.href = '/deliveryinfo';
        }
    });

    $("#search").on("click", (e) => {

        preload();

        e.preventDefault();

        var nik = $('#nick_name').val();

        $('#nick_name').val('');

        sessionStorage.setItem('NIKINSTA', nik);

        $('#sheet_name h1').hide();
        $('#sheet_name').hide();
        $('.table_payment').hide();
        $('#to_delivery').hide();

        if (nik != ""){
            $('.text').show();
            $('#to_delivery').attr('class', 'display_none');

            var data = {
                nik: nik
            }
            
            $.ajax({
                type: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                url: '/readdata'
            }).done(data => {
                if (data.ok){

                    console.log(data);

                    $('.text').hide();
                    sessionStorage.setItem('nikDATA', JSON.stringify(data.data));

                    var sheet = Object.keys(data.data);

                    console.log(sheet);
                    $('#sheet_name ul li').remove();
                    $('#sheet_name').show();
                    $('.table_payment').show();
                    $('#to_delivery').show();

                    if (sheet.length == 0){
                        $('#sheet_name h1').show();
                        $('#sheet_name h3').hide();
                        $('#sheet_name p').hide();
                        $('.table_payment').hide();
                        $('#to_delivery').hide();
                    } 

                    var code = '';
                    var summ = 0;
                    var names = [];
                    var pickup = {}
                    var deliv_sum = 0
                    sheet.map((sh) => {

                        var sh_name = sh.split('-')

                        if (sh_name.length > 1){
                            pickup[sh] = true;
                        } else {
                            pickup[sh] = false;
                        }
                        
                        $('#sheet_name ul').append(`<li>${sh_name[0]}</li>`);

                        names.push(sh);

                        $('.table_payment tbody tr').remove();

                        var class_name = '';

                        if (sheet.length == 1){
                            $('#sheet_name ul li').addClass('active_sheet');
                            class_name = ' class="active_tr"';
                            var deliv = data.data[sh].delivery[0];
                            sessionStorage.setItem('DELIVERY_SUM_MAIN', JSON.stringify(deliv));
                        }
                        
                        for (var i=0; i < data.data[sh].name.length; i++){
                            summ += +data.data[sh].price[i]
                            code +=`<tr${class_name}>
                                    <td>${data.data[sh].name[i]}</td>
                                    <td>${data.data[sh].art[i]}</td>
                                    <td>${data.data[sh].col[i]}</td>
                                    <td>${data.data[sh].price[i]}</td>
                                    <td style="display:none;">${sh}</td>
                                </tr>`;
                        }
                        

                    });
                    
                    if (sheet.length > 1) {
                        deliv_sum = '?';
                    } else {
                        deliv_sum = summ;
                    }
                    
                    sessionStorage.setItem('PICKUP', JSON.stringify(pickup));

                    $('.table_payment tbody').append(code);
                    $('.table_payment tfoot').html(`
                    <tr>
                        <td style="text-align: right;">К оплате:</td>
                        <td>${deliv_sum} ₽</td>
                        <td style="text-align: right;">ОБЩАЯ СУММА:</td>
                        <td>${summ} ₽</td>
                    </tr>
                    `);

                    sessionStorage.setItem('SUMMA', summ);
                    sessionStorage.setItem('SHEETNAME', JSON.stringify(names));


                } else {

                    console.log(data);

                    $('.text').hide();
                    $('#sheet_name h1').show();
                    $('#sheet_name h1').text('Ошибка, попробуйте позже!');
                    $('#sheet_name h3').hide();
                    $('#sheet_name p').hide();
                    $('.table_payment').hide();
                    $('#to_delivery').hide();
                }
            });
        }
        
    });

    $('.label_block').click(function(e){
    
        var block_left = document.getElementsByClassName('left')[0];
        var block_right = document.getElementsByClassName('right')[0];

        var h_three = document.getElementsByTagName('h3')[1];

        if (e.target.textContent == "ПВЗ Боксберри") {

            $('.modal_back').css('top', $(window).scrollTop());
            $('.modal_back').show();
            $('.modal_window').show();

            $('.modal_window').css('opacity', 0);
            $('.modal_window').animate({'opacity': 1}, 1000);

            $('body, html').css('overflow-y', 'hidden');

            $('#index').hide(400);
            $('#city').hide(200);
            $('#street').hide(200);
            $('#home').hide(200);
            $('#room').hide(200);
            $('#adress_text').hide();

            $('.show_form_city').show();
            var sity = '';
            //var api_token = 'T6KqdLlDga5Y6k5thMb7aA==';
            var api_token = '1$DQfLQIlkMsD3yNRnBsqRjt3Z9H3I2hcB';
            var custom_city = sity;
            var target_start = '';
            var ordersum = '';
            var weight = '';
            var paysum = 0;
            var height = '';
            var width = '';
            var depth = '';

            $('#boxberry_map').text('');

            boxberry.openOnPage('boxberry_map'); 
            boxberry.open(boxberry_function, api_token, custom_city, target_start, ordersum, weight, paysum, height, width, depth);

            sessionStorage.setItem('DELIRVERY', "ПВЗ Боксберри");

            var delivery = document.getElementsByClassName('right')[0].getElementsByTagName('h4')[1];
            if (type_page == 'Pay-Instagramm'){
                delivery.textContent = JSON.parse(JSON.parse(sessionStorage.getItem('DELIVERY_SUM_MAIN'))) + " руб.";
            } else {
                delivery.textContent = "250 руб.";
            }

            $('.left:eq(0) h5').remove();
            $('.right:eq(0) h5').remove();

            if (type_page == 'Pay-Instagramm'){
                h_three.textContent = Number(sessionStorage.getItem("SUMMA")) + Number(JSON.parse(sessionStorage.getItem('DELIVERY_SUM_MAIN'))) + " руб.";
            } else {
                h_three.textContent = Number(sessionStorage.getItem("SUMMA")) + Number(250) + " руб.";
            }

        }
        else if (e.target.textContent == "Почта России"){

            $('#city').val('');
            $('#city').attr('readonly', false);
            $('#index').show(400);

            $('#adress').hide(200);
            $('#city').show(200);
            $('#street').show(200);
            $('#home').show(200);
            $('#room').show(200);

            $('#error_text').hide(200);
            $('#adress_text').hide();

            sessionStorage.setItem('DELIRVERY', "Почта России");

            h_three.textContent = Number(sessionStorage.getItem("SUMMA")) + 250 + " руб.";

            try{
                block_left.removeChild(block_left.getElementsByTagName('h5')[0]);
                block_right.removeChild(block_right.getElementsByTagName('h5')[0]);
            }
            catch (e) {
                var delivery = document.getElementsByClassName('right')[0].getElementsByTagName('h4')[1];
                delivery.textContent = "250 руб.";
                return;
            }

            var delivery = document.getElementsByClassName('right')[0].getElementsByTagName('h4')[1];
            delivery.textContent = "250 руб.";

        }
        else if (e.target.textContent == "Курьер-Москва"){

            $('#city').val('Москва');
            $('#city').attr('readonly', true);
            $('#index').hide(400);

            $('#adress').hide(200);
            $('#city').show(200);
            $('#street').show(200);
            $('#home').show(200);
            $('#room').show(200);

            $('#error_text').hide(200);
            $('#adress_text').hide();

            sessionStorage.setItem('DELIRVERY', "Курьер-Москва");

            if (type_page == 'Pay-Instagramm'){
                h_three.textContent = Number(sessionStorage.getItem("SUMMA")) + Number(JSON.parse(sessionStorage.getItem('DELIVERY_SUM_MAIN'))) + " руб.";
            } else{
                h_three.textContent = Number(sessionStorage.getItem("SUMMA")) + Number(250) + " руб.";
            }

            try{
                block_left.removeChild(block_left.getElementsByTagName('h5')[0]);
                block_right.removeChild(block_right.getElementsByTagName('h5')[0]);
            }
            catch (e){
                var delivery = document.getElementsByClassName('right')[0].getElementsByTagName('h4')[1];

                if (type_page == 'Pay-Instagramm'){
                    delivery.textContent = JSON.parse(sessionStorage.getItem('DELIVERY_SUM_MAIN')) + " руб.";
                } else{
                    delivery.textContent = "250 руб.";
                }

                return;
            }

            var delivery = document.getElementsByClassName('right')[0].getElementsByTagName('h4')[1];
            if (type_page == 'Pay-Instagramm'){
                delivery.textContent = JSON.parse(sessionStorage.getItem('DELIVERY_SUM_MAIN')) + " руб.";
            } else{
                delivery.textContent = "250 руб.";
            }

        }
        else if (e.target.textContent == "Курьер-СПб"){

            $('#city').val('Санкт-Петербург');
            $('#city').attr('readonly', true);
            $('#index').hide(400);

            $('#adress').hide(200);
            $('#city').show(200);
            $('#street').show(200);
            $('#home').show(200);
            $('#room').show(200);

            $('#error_text').hide(200);
            $('#adress_text').hide();

            sessionStorage.setItem('DELIRVERY', "Курьер-СПб");

            if (type_page == 'Pay-Instagramm'){
                h_three.textContent = Number(sessionStorage.getItem("SUMMA")) + Number(JSON.parse(sessionStorage.getItem('DELIVERY_SUM_MAIN'))) + " руб.";
            } else{
                h_three.textContent = Number(sessionStorage.getItem("SUMMA")) + Number(350) + " руб.";
            }
            
            try{
                block_left.removeChild(block_left.getElementsByTagName('h5')[0]);
                block_right.removeChild(block_right.getElementsByTagName('h5')[0]);
            }
            catch (e) {
                var delivery = document.getElementsByClassName('right')[0].getElementsByTagName('h4')[1];
                if (type_page == 'Pay-Instagramm'){
                    delivery.textContent = JSON.parse(sessionStorage.getItem('DELIVERY_SUM_MAIN')) + " руб.";
                } else{
                    delivery.textContent = "350 руб.";
                }
                return;
            }

            var delivery = document.getElementsByClassName('right')[0].getElementsByTagName('h4')[1];
            if (type_page == 'Pay-Instagramm'){
                delivery.textContent = JSON.parse(sessionStorage.getItem('DELIVERY_SUM_MAIN')) + " руб.";
            } else{
                delivery.textContent = "350 руб.";
            }

        }
        else if (e.target.textContent == "Самовывоз"){

            $('#index').hide(200);
            $('#adress').hide(200);
            $('#city').hide(200);
            $('#street').hide(200);
            $('#home').hide(200);
            $('#room').hide(200);

            $('#error_text').hide(200);
            $('#adress_text').hide();

            sessionStorage.setItem('DELIRVERY', "Самовывоз");

            h_three.textContent = Number(sessionStorage.getItem("SUMMA")) + " руб.";

            try{
                block_left.removeChild(block_left.getElementsByTagName('h5')[0]);
                block_right.removeChild(block_right.getElementsByTagName('h5')[0]);
            }
            catch (e) {
                var delivery = document.getElementsByClassName('right')[0].getElementsByTagName('h4')[1];
                delivery.textContent = "0 руб.";
                return;
            }

            var delivery = document.getElementsByClassName('right')[0].getElementsByTagName('h4')[1];
            delivery.textContent = "0 руб.";
        }

    });

    $('input').click(() => {
        $('#error_input').attr('class', 'display_none');
    });

    $('#next').click(function(e){

        
        var delivery = $('.radio_block:checked').val();
        $('#error_input').text('* Необходимо заполнить все обязательные поля');
        var product_sum = document.getElementsByClassName('right')[0].getElementsByTagName('h4')[0].textContent.replace(' руб.', '');
        var all_sum = document.getElementsByClassName('right')[1].getElementsByTagName('h3')[0].textContent.replace(' руб.', '');

        if (type_page == 'Pay-Instagramm'){
            var insta = sessionStorage.getItem('NIKINSTA');
            $('#insta').val(insta);
            var url = '/saveshopandsberpay';
            var id_shop = "";
            var sheet_products = JSON.parse(sessionStorage.getItem('nikDATA'));
            var purchase = JSON.parse(sessionStorage.getItem('SHEETNAME'))[0];
            var delivery_sum = JSON.parse(sessionStorage.getItem('DELIVERY_SUM_MAIN'));
        } else{
            var insta = $('#insta').val();
            var url = '/saveproductsandsberpay';
            var sheet_products = "";
            var id_shop = JSON.parse(sessionStorage.getItem('ID_SHOPPING'));
            var purchase = "";
            var delivery_sum = $('.right h4:eq(1)').text().replace(' руб.', '');
        }

        var data = {
            sheet_products: sheet_products,
            ids: id_shop,
            purchase: purchase,
            nik: insta,
            telephone: $('#phone').val(),
            fio: $('#lname').val() + ' ' + $('#fname').val() + ' ' + $('#mname').val(),
            city: $('#city').val(),
            index: $('#index').val(),
            street: $('#street').val(),
            home: $('#home').val(),
            room: $('#room').val(),
            delivery: delivery,
            deliveryAddress: $('#adress').val(),
            comment: $('#comment').val(),
            numOrder: '',
            sumOrder: product_sum,
            sumDelivery: delivery_sum,
            summ: all_sum
        }

        if (delivery == 'ПВЗ Боксберри'){
            if ($('#insta').val() != "" && $('#lname').val() != "" && $('#fname').val() != "" && $('#mname').val() != "" && $('#phone').val() != ""  && $('#adress').val() != ''){
                $.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: url
                }).done(function(data){
                    if (data.ok){
                        if (data.data.errorCode){
                            $('#error_input').removeAttr('class');
                            $('#error_input').text('Произошла ошибка, повторите операцию позже!');
                        } else {
                            var url = data.data.formUrl;
                            sessionStorage.setItem('numberOrder', data.numOrder);
                            sessionStorage.setItem('urlPayment', url);
                            $(location).attr('href',url);
                        }
                    } else {
                        $('#error_input').removeAttr('class');
                        $('#error_input').text(data.text);
                    }
                });
        
                sessionStorage.setItem("DATA_INFO", JSON.stringify(data));
                $('#error_input').attr('class', 'display_none');
            } else {
                if ($('#insta').val() == '') $('#insta').addClass('error');
                if ($('#lname').val() == '') $('#lname').addClass('error');
                if ($('#fname').val() == '') $('#fname').addClass('error');
                if ($('#mname').val() == '') $('#mname').addClass('error');
                if ($('#phone').val() == '') $('#phone').addClass('error');
                if ($('#adress').val() == '') $('#adress').addClass('error');

                $('#error_input').removeAttr('class');
            }
        }else if (delivery == 'Почта России'){

            if ($('#lname').val() != "" && $('#fname').val() != "" && $('#mname').val() != "" && $('#city').val() != "" && $('#index').val() != "" && $('#street').val() != "" && $('#home').val() != "" && $('#room').val() != "" && $('#phone').val() != ""){
                $.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: url
                }).done(function(data){
                    if (data.ok){
                        if (data.data.errorCode){
                            $('#error_input').removeAttr('class');
                            $('#error_input').text('Произошла ошибка, повторите операцию позже!');
                        } else {
                            var url = data.data.formUrl;
                            sessionStorage.setItem('numberOrder', data.numOrder);
                            sessionStorage.setItem('urlPayment', url);
                            $(location).attr('href',url);
                        }
                    } else {
                        $('#error_input').removeAttr('class');
                        $('#error_input').text(data.text);
                    }
                });
        
                sessionStorage.setItem("DATA_INFO", JSON.stringify(data));
                $('#error_input').attr('class', 'display_none');
            } else{

                if ($('#insta').val() == '') $('#insta').addClass('error');
                if ($('#lname').val() == '') $('#lname').addClass('error');
                if ($('#fname').val() == '') $('#fname').addClass('error');
                if ($('#mname').val() == '') $('#mname').addClass('error');
                if ($('#city').val() == '') $('#city').addClass('error');
                if ($('#index').val() == '') $('#index').addClass('error');
                if ($('#street').val() == '') $('#street').addClass('error');
                if ($('#home').val() == '') $('#home').addClass('error');
                if ($('#room').val() == '') $('#room').addClass('error');
                if ($('#phone').val() == '') $('#phone').addClass('error');

                $('#error_input').removeAttr('class');
            }
        }else if (delivery == 'Курьер-Москва' || delivery == 'Курьер-СПб'){
            if ($('#insta').val() != "" && $('#lname').val() != "" && $('#fname').val() != "" && $('#mname').val() != "" && $('#city').val() != "" && $('#street').val() != "" && $('#home').val() != "" && $('#room').val() != "" && $('#phone').val() != ""){
                $.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: url
                }).done(function(data){
                    if (data.ok){
                        if (data.data.errorCode){
                            $('#error_input').removeAttr('class');
                            $('#error_input').text('Произошла ошибка, повторите операцию позже!');
                        } else {
                            var url = data.data.formUrl;
                            sessionStorage.setItem('numberOrder', data.numOrder);
                            sessionStorage.setItem('urlPayment', url);
                            $(location).attr('href',url);
                        }
                    } else {
                        $('#error_input').removeAttr('class');
                        $('#error_input').text(data.text);
                    }
                });
        
                sessionStorage.setItem("DATA_INFO", JSON.stringify(data));
                $('#error_input').attr('class', 'display_none');
            } else{

                if ($('#insta').val() == '') $('#insta').addClass('error');
                if ($('#lname').val() == '') $('#lname').addClass('error');
                if ($('#fname').val() == '') $('#fname').addClass('error');
                if ($('#mname').val() == '') $('#mname').addClass('error');
                if ($('#city').val() == '') $('#city').addClass('error');
                if ($('#street').val() == '') $('#street').addClass('error');
                if ($('#home').val() == '') $('#home').addClass('error');
                if ($('#room').val() == '') $('#room').addClass('error');
                if ($('#phone').val() == '') $('#phone').addClass('error');

                $('#error_input').removeAttr('class');
            }
        }else if (delivery == 'Самовывоз'){
            if ($('#lname').val() != "" && $('#fname').val() != "" && $('#mname').val() != "" && $('#phone').val() != ""){
                $.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: url
                }).done(function(data){
                    if (data.ok){
                        if (data.data.errorCode){
                            $('#error_input').removeAttr('class');
                            $('#error_input').text('Произошла ошибка, повторите операцию позже!');
                        } else {
                            var url = data.data.formUrl;
                            sessionStorage.setItem('numberOrder', data.numOrder);
                            sessionStorage.setItem('urlPayment', url);
                            $(location).attr('href',url);
                        }
                    } else {
                        $('#error_input').removeAttr('class');
                        $('#error_input').text(data.text);
                    }
                });
        
                sessionStorage.setItem("DATA_INFO", JSON.stringify(data));
                $('#error_input').attr('class', 'display_none');
            } else {

                if ($('#insta').val() == '') $('#insta').addClass('error');
                if ($('#lname').val() == '') $('#lname').attr('class', 'error');
                if ($('#fname').val() == '') $('#fname').attr('class', 'error');
                if ($('#mname').val() == '') $('#mname').attr('class', 'error');
                if ($('#phone').val() == '') $('#phone').attr('class', 'error');

                $('#error_input').removeAttr('class');
            }
        }else {
            $('#error_input').removeAttr('class');
            $('#error_input').text('Необходимо выбрать способ доставки!');
        }

    });

    $('input').focus(() => {
        $('input').removeClass('error');
    });

    $('#search_dot').on('click', () => {

        $('.modal_window h5').hide();

        if ($('#index_modal').val() != "") {

            var data = {
                index: $('#index_modal').val()
            }

            $.ajax({
                type: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                url: '/boxberryquery'
            }).done(function(data){
                $('#adress').hide();
                $('#adress_text').hide();
                if(data.ok){
                    $('#adress').show(200);
                    $('#adress_text').show();
                    $('#adress').val(data.data.Address);
                    $('#adress').attr('readonly', true);
                    
                    $('.modal_back').hide();
                    $('.modal_window').hide();

                    $('body, html').css('overflow-y', 'auto');
                }else{
                    $('.modal_window h5').show();
                    $('.modal_window h5').text(data.text);
                }
            });
        }
    
    });

    $('.close').on('click', (e) => {
        $('.modal_back').hide();
        $('.modal_window').hide();
        $('#adress').show();
        $('body, html').css('overflow-y', 'auto');
    });

    $('.basket_button').on('click', (e) => {
        $('html, body').css('overflow', 'hidden');
        $('.page_basket').show();
        $('.page_basket').animate({'opacity': 1}, 500);
        $('.page_basket').css({
            'top': $(window).scrollTop(),
            'overflow': 'auto'
        });
    });

    $('.product').on('click', (e) => {
        if (e.target.tagName != 'BUTTON'){
            $('html, body').css('overflow', 'hidden');
            $('.product_info').show();
            $('.product_info').animate({'opacity': 1}, 500);
            $('.product_info').css({
                'top': $(window).scrollTop(),
                'overflow': 'auto'
            });

            if (e.target.parentElement.className == 'block_foto'){
                var id = e.target.parentElement.parentElement.children[4].id;
            } else {
                var id = e.target.parentElement.children[4].id;
            }
            var data = JSON.parse(sessionStorage.getItem('ALL_PRODUCTS'));

            data.product.map((item) => {
                if (item.id == id) {
                    $('.block_info_item:eq(0) p').text(item.description);
                    $('.block_info_item:eq(1) p').text(item.use);
                    $('.block_info_item:eq(2) p').text(item.measures);
                    $('.block_info_item:eq(3) p').text(item.composition);
                    $('.block_info_item:eq(4) p').text(item.storage);
                    $('.block_info_item:eq(5) p').text(item.manufacturer);
                    $('.block_info_item:eq(6) p').text(item.organization);
                    $('.block_info_item:eq(7) p').text(item.number);
                    $('.block_info_item:eq(8) p').text(item.date_save);
                    $('.block_info_item:eq(9) p').text(item.manufactured_by);
                    $('.block_info_item:eq(10) p').text(item.valid_until);
                    $('.block_info_item:eq(11) p').text(item.volume);
                    $('.block_info_item:eq(12) p').text(item.code);

                    $('.info_name').text(item.full_name);

                    $('.info_photo img').attr('src', item.photo)
                }
            });
        }
    })

    $('#close_basket').on('click', (e) => {
        $('.page_basket').animate({'opacity': 0}, 500, () => {
            $('.page_basket').hide();
            $('html, body').css('overflow-y', 'auto');
        });
    });
    $('#close_product_info').on('click', (e) => {
        $('.product_info').animate({'opacity': 0}, 500, () => {
            $('.product_info').hide();
            $('html, body').css('overflow-y', 'auto');
        });
    })

    // ЛОГИКА ИНТЕРНЕТ МАГАЗИНА
    $(document).delegate( ".in_basket", "click", (e) => {
        
        var data = {
            id: e.target.id
        }

        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: '/productinfo'
        }).done(function(data){
            if (data.ok){

                console.log(data);

                var pr = data.pr;
                $('.pr_info_left .name_pr_inf').text(pr.name);
                $('.pr_info_left p:eq(1)').html(`Артикул: <span>${pr.code}</span>`);
                $('.pr_info_foto').html(`<img src="${pr.photo[0]}" alt="">`);

                $('#product_id_b').text(pr.id);

                $('.all_foto').text('');
                for (var i = 0; i < pr.photo.length; i++){
                    if (i > 0){
                        $('.all_foto').append(`<div class="all_item"><img src="${pr.photo[i]}" alt=""></div>`);
                    } else {
                        $('.all_foto').append(`<div class="all_item all_item_active"><img src="${pr.photo[i]}" alt=""></div>`);
                    }
                }

                $('.info_info_body:eq(0) p:eq(0)').html(`<span>Бренд: </span> ${pr.provider}`);
                $('.info_info_body:eq(0) p:eq(1)').html(`<span>Сезонность: </span> ${pr.season}`);
                $('.info_info_body:eq(0) p:eq(2)').html(`<span>Состав: </span> ${pr.composition}`);

                $('.info_price h1').html(`${pr.price} руб.`);

                $('.info_size_all').text('');

                for (var i = 0; i < pr.size.length; i++){
                    if (Number(pr.number[i]) > 0 && pr.size[i]) {
                        $('.info_size_all').append(`<div class="size_all_item">${pr.size[i]}</div>`);
                    } else {
                        $('.info_size').hide();
                    }
                }

                /*if (pr.size.length >= 1){
                    for (var i = 0; i < pr.size.length; i++){
                        if (pr.number[i] > 0 && pr.size[i]) {
                            $('.info_size_all').append(`<div class="size_all_item">${pr.size[i]}</div>`);
                        }
                    }
                } else {
                    if (pr.size[0]){
                        $('.info_size_all').append(`<div class="size_all_item">${pr.size[0]}</div>`);
                    } else {
                        $('.info_size').hide();
                    }
                }*/

                $('html, body').css('overflow-y', 'hidden');
                $('.modal_block').css('top', $(window).scrollTop());
                $('.modal_block').show();
            } else {
                alert('Не удалось загрузить информацию о товаре, попробуйте позже!');
            }
        });
        
    });
    $('.page').on('click', (e) => {
        if (e.target.className == 'col_status'){
            var ids = e.target.parentElement.parentElement.id;

            $(e.target.parentElement.parentElement).remove();
            var arr = JSON.parse(sessionStorage.getItem('SHOPPING'));
            
            var summ = parseInt(JSON.parse(sessionStorage.getItem('SUMMA')));
            var minus = Number(arr[ids].price)*Number(arr[ids].col)
            summ = summ-minus;

            delete arr[ids];
            sessionStorage.setItem('SHOPPING', JSON.stringify(arr));
            sessionStorage.setItem('SUMMA', summ);

            $('.page_summa').html('ИТОГО: <span>' + summ + ' ₽</span>');
            var len = $('.page_product').length;

            var len_x = 0;
            for (i=0; i < len; i++){
                len_x += +$(`.page_product:eq(${i}) .page_p_name .page_p_n_col .col_col`).text();
            }

            $('#count_product').text(len_x);
            if (len == 0) {
                $('#count_product').hide();
            }
        } else if (e.target.className == 'col_status col_minus') {
            var ids = e.target.parentElement.parentElement.parentElement.id;

            var col_el = e.target.parentElement.children[1];
            var col = parseInt(col_el.textContent);

            var pr_el = e.target.parentElement.parentElement.children[1];
            var price = parseInt(pr_el.textContent.replace(/\D+/g,"")) / col;
            
            var arr = JSON.parse(sessionStorage.getItem('SHOPPING'));

            if (col > 1 ) {
                col_el.textContent = +col - 1;
                arr[ids].col = +col - 1;
                pr_el.textContent = String(price * +(col-1)) + ' ₽';
                var summ = parseInt(JSON.parse(sessionStorage.getItem('SUMMA')));
                summ = summ - price;

                $('.page_summa').html('ИТОГО: <span>' + summ + ' ₽</span>');

                sessionStorage.setItem('SUMMA', summ);
                sessionStorage.setItem('SHOPPING', JSON.stringify(arr));yarn 
            }


        } else if (e.target.className == 'col_status col_plus') {
            var ids = e.target.parentElement.parentElement.parentElement.id;

            var col_el = e.target.parentElement.children[1];
            var col = col_el.textContent;

            var pr_el = e.target.parentElement.parentElement.children[1];
            var price = parseInt(pr_el.textContent.replace(/\D+/g,"")) / col;

            var arr = JSON.parse(sessionStorage.getItem('SHOPPING'));

            if (+col + 1 <= arr[ids].maxCol){
                col_el.textContent = +col + 1;
                arr[ids].col = +col + 1;

                pr_el.textContent = String(+price * (+col+1)) + ' ₽';

                var summ = parseInt(JSON.parse(sessionStorage.getItem('SUMMA')));
                summ = summ + price;

                $('.page_summa').html('ИТОГО: <span>' + summ + ' ₽</span>');

                sessionStorage.setItem('SUMMA', summ);
                sessionStorage.setItem('SHOPPING', JSON.stringify(arr));
            } else {
                alert("Нельзя купить больше!");
            }

            
        }
    });
    $('#pay_products').on('click', (e) => {
        var summ = parseInt(sessionStorage.getItem('SUMMA'));
        if (summ > 0) {
            sessionStorage.setItem('TYPE_PAGE', 'Shopping');

            var data = JSON.parse(sessionStorage.getItem('SHOPPING'));

            $.ajax({
                type: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                url: '/inbasket'
            }).done(function(data){
                if (data.ok){
                    var url = '/deliveryinfo';
                    sessionStorage.setItem('ID_SHOPPING', JSON.stringify(data.oks.id)) ;
                    $(location).attr('href', url);
                } else {
                    alert(data.text);
                }
            });

        } else {
            alert('Корзина пуста!');
        }
    });
    var boxberry_function = (result) => {
        $('#adress').show(200);
        $('#adress_text').show();
        $('#adress').val(result.address);
        $('#adress').attr('readonly', true);

        $('.modal_back').hide();
        $('html, body').css('overflow-y', 'auto');
    }
    $('.close_elips').on('click', () => {
        $('#adress').show(200);
        $('#adress_text').show();
        $('#adress').attr('readonly', true);

        $('.modal_back').hide();
        $('.modal_block').hide();
        $('html, body').css('overflow-y', 'auto');

        if (window.location.pathname == '/admin'){
            location.reload();
        }
    });
    $('#adress, #adress_text').on('click', (e) => {
        $('.modal_back').css('top', $(window).scrollTop())
        $('html, body').css('overflow-y', 'hidden');
        $('.modal_back').show();
    });
    $(document).delegate( ".size_all_item", "click", (e) => {
        $('.size_all_item').removeAttr('id');
        e.target.id = 'size_all_active';
    });
    $(document).delegate( ".all_item", "click", (e) => {
        if (e.target.parentElement.className.indexOf('all_item') != -1){
            $('.all_item').removeClass('all_item_active')
            $(e.target.parentElement).addClass('all_item_active');
            var image = $(e.target).attr('src');
            $('.pr_info_foto img').attr('src', image);
            console.log("Нажатие на all_item");
        }
    });
    $('.title_item').on('click', (e) => {
        $('.title_item').removeAttr('id');
        e.target.id = 'title_item_active';
        if (e.target.textContent == "Описание") {
            $('.info_info_body:eq(0)').show();
            $('.info_info_body:eq(1)').hide();
        } else{
            $('.info_info_body:eq(0)').hide();
            $('.info_info_body:eq(1)').show();
        }
    });
    $('#back_page, #close_info_prod').on('click', (e) => {
        $('.title_item').removeAttr('id');
        $('.title_item:eq(0)').attr('id', 'title_item_active');
        $('.all_item').removeClass('all_item_active')
        $('.all_item:eq(0)').addClass('all_item_active');
        var image = $('.all_item:eq(0) img').attr('src');
        $('.pr_info_foto img').attr('src', image);
        $('.size_all_item').removeAttr('id');
        $('.modal_block').hide();
        $('html, body').css('overflow-y', 'auto');
    })

    $('.fotos_right').on('click', (e) => {
        var len = $('.fotos_body img').length;
        for (var i=0; i < len; i++){
            var foto = $('.fotos_body img:eq('+i+')');
            var x = i+1;
            if (!foto.attr('style') && i < len-1){
                foto.hide();
                $('.fotos_body img:eq('+x+')').show();
                break;
            }
        }
        for (var i=0; i < len; i++){
            var foto = $('.fotos_body img:eq('+i+')');
            if (!foto.attr('style')){
                $('#selected_foto').text(`Активное фото: ${i+1} из ${len}`);
                break;
            }
        }
    });
    $('.fotos_left').on('click', (e) => {
        var len = $('.fotos_body img').length;
        for (var i=0; i < len; i++){
            var foto = $('.fotos_body img:eq('+i+')');
            var x = i-1;
            if (!foto.attr('style') && i > 0){
                foto.hide();
                $('.fotos_body img:eq('+x+')').show();
                break;
            }
        }
        for (var i=0; i < len; i++){
            var foto = $('.fotos_body img:eq('+i+')');
            if (!foto.attr('style')){
                $('#selected_foto').text(`Активное фото: ${i+1} из ${len}`);
                break;
            }
        }
    });
    $(document).delegate( "#admin_table tbody tr", "click", (e) => {
        $('#id_prod').text(e.target.parentElement.children[0].textContent);

        var data = {
            id: e.target.parentElement.children[0].textContent
        }

        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: '/productinfo'
        }).done(function(data){
            if (data.ok){
                console.log(data);
                for (var i = 0; i < data.pr.photo.length; i++){
                    if (i == 0){
                        if (i == data.pr.photo.length-1){
                            $('.pr_info_foto').html('<img src="' + data.pr.photo[i] + '" alt="">')
                            $('.all_item').html('<img src="' + data.pr.photo[i] + '" alt="">');
                            $('.all_foto').append(`<div class="all_item">
                                <label for="upload_foto_node" class="modal_button" id="upload_foto">
                                    <input type="file" id="upload_foto_node" id="file" name="file" accept="image/jpeg,image/png,image/gif">
                                    +
                                </label>
                            </div>`);
                        } else {
                            $('.pr_info_foto').html('<img src="' + data.pr.photo[i] + '" alt="">')
                            $('.all_item').html('<img src="' + data.pr.photo[i] + '" alt="">');
                        }
                        
                    } else if (i == data.pr.photo.length-1){
                        $('.all_foto').append(`<div class="all_item"><img src="${data.pr.photo[i]}" alt=""></div>`);
                        
                    }else {
                        $('.all_foto').append(`<div class="all_item"><img src="${data.pr.photo[i]}" alt="">
                        </div>`);
                    }
                }

                if (data.pr.photo.length < 6 && data.pr.photo.length > 1){
                    $('.all_foto').append(`<div class="all_item">
                        <label for="upload_foto_node" class="modal_button" id="upload_foto">
                            <input type="file" id="upload_foto_node" id="file" name="file" accept="image/jpeg,image/png,image/gif">
                            +
                        </label>
                    </div>`);
                }

                $('#nameProduct').val(data.pr.name);
                $('#codeProduct').val(data.pr.code);
                $('#providerProduct').val(data.pr.provider);
                $('#priceProduct').val(data.pr.price);

                for (var i = 0; i < data.pr.size.length; i++){
                    if (data.pr.size[i] == ""){
                        $('.info_size_all').append(`
                            <div class="size_all_row">
                                <input type="text" class="middle_input" value="Без размера">
                                <h2 style="margin:0px 5px;"> – </h2>
                                <input type="text" class="middle_input" value="${data.pr.number[i]}">
                            </div>
                        `);
                    } else {
                        $('.info_size_all').append(`
                            <div class="size_all_row">
                                <input type="text" class="middle_input" value="${data.pr.size[i]}">
                                <h2 style="margin:0px 5px;"> – </h2>
                                <input type="text" class="middle_input" value="${data.pr.number[i]}">
                            </div>
                        `);
                    }
                }

                $('#info_product_modal').css('top', $(window).scrollTop());
                $('#info_product_modal').show();
                $('body, html').css('overflow', 'hidden');

            } else {
                alert("Произошла неизвестная ошибка!!!");
            }
        });
    })

    var getSignedRequest = (file) => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/sign-s3?file-name=${file.name}&file-type=${file.type}`);
        xhr.onreadystatechange = () => {
            if(xhr.readyState === 4){
                if(xhr.status === 200){
                    const response = JSON.parse(xhr.responseText);
                    uploadFile(file, response.signedRequest, response.url);
                }
                else{
                    alert('Could not get signed URL.');
                }
            }
        };
        xhr.send();
    }
    var uploadFile = (file, signedRequest, url) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signedRequest);
        xhr.onreadystatechange = () => {
            if(xhr.readyState === 4){
                if(xhr.status === 200){
                    var dataR = {
                        id: $('#id_prod').text(),
                        path: url
                    }
                    var pathImage = url;

                    $.ajax({
                        type: 'POST',
                        data: JSON.stringify(dataR),
                        contentType: 'application/json',
                        url: '/savepathphoto'
                    }).done(function(data){
                        if (!data.ok){
                            alert('При добавлении фото в бд произошла ошибка!');
                        }
                    });

                    var len = $('.all_item').length;
                    console.log(pathImage);

                    if (len > 0 && len <= 5){
                        $('.pr_info_foto').html('<img src="'+pathImage+'" alt="">')
                        $(`.all_item:eq(${len-1})`).html('<img src="'+pathImage+'" alt="">');
                        $('.all_foto').append(`<div class="all_item">
                            <label for="upload_foto_node" class="modal_button" id="upload_foto">
                                <input type="file" id="upload_foto_node" id="file" name="file" accept="image/jpeg,image/png,image/gif">
                                +
                            </label>
                        </div>`);
                    } else {
                        $('.pr_info_foto').html('<img src="'+pathImage+'" alt="">')
                        $(`.all_item:eq(${len-1})`).html('<img src="'+pathImage+'" alt="">');
                    }
                }
                else{
                    alert('Загруженный файл не найден!');
                }
            }
        };
        xhr.send(file);
    }

    $(document).delegate( "#upload_foto_node", "change", (e) => {
    
        var formData = new FormData();
        formData.append('file', $('#upload_foto_node')[0].files[0]);

        const files = document.getElementById('upload_foto_node').files;
        const file = files[0];
        if(file == null){
            return alert('No file selected.');
        }
        if ($('.all_item').length <= 6){
            getSignedRequest(file);
        } else {
            alert('Загружено максимальное количество фото!');
        }

    });

    $('#in_basket_to').on('click', (e) => {

        var id = $('#product_id_b').text();
        var size = $('#size_all_active').text();

        var data = {
            id: id
        }

        var info_size = $('.info_size').attr('style');
        $('.page_basket').css('top', $(window).scrollTop());

        if (info_size != "display: none;"){
            if (size){
                $.ajax({
                    type: 'POST',
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: '/productinfo'
                }).done(function(data){
                    if (data.ok){
                        var sizeIndex = data.pr.size.indexOf(size);
                        if (sizeIndex != -1){
                            if (Number(data.pr.number[sizeIndex]) > 0){

                                var basket = JSON.parse(sessionStorage.getItem('SHOPPING'));
                                if (!basket){
                                    basket = {};
                                }

                                if (!basket[id]) {
                                    $('.page_splin:eq(1)').append(
                                        `<div class="page_product" id="${id}">
                                            <div class="page_p_photo"><img src="${data.pr.photo[0]}" alt=""></div>
                                            <div class="page_p_name">
                                                <div class="page_p_n_text">${data.pr.name}</div>
                                                <div class="page_p_n_price">${data.pr.price} ₽</div>
                                                <div class="page_p_n_col">
                                                    <div class="col_status col_minus">–</div>
                                                    <div class="col_col">1</div>
                                                    <div class="col_status col_plus">+</div>
                                                </div>
                                            </div>
                                            <div class="page_p_remove">
                                                <div class="col_status">×</div>
                                            </div>
                                        </div>`
                                    );
                                    var summ = Number($('.page_summa span').text().replace(/\D+/g,"")) + Number(data.pr.price);
                                    $('.page_summa span').html(`${summ} ₽`);

                                    basket[id] = {
                                        maxCol: data.pr.number[sizeIndex],
                                        price: data.pr.price,
                                        name: data.pr.name,
                                        col: 1,
                                        photo: data.pr.photo[0],
                                        size: size,
                                        code: data.pr.code,
                                        provider: data.pr.provider
                                    }

                                    sessionStorage.setItem('SHOPPING', JSON.stringify(basket));
                                    sessionStorage.setItem('SUMMA', JSON.stringify(summ));
                                    

                                    $('#count_product').text(Number($('#count_product').text()) + 1);
                                    $('#count_product').show();

                                }

                                $('.page_basket').show();
                                $('.page_basket').animate({'opacity': 1}, 500);
                                $('.modal_block').hide();
                            }
                        }

                    } else {
                        alert('Попробуйте позже. Сервис временно недоступен!');
                    }
                });
            } else{
                alert('Необходимо выбрать размер!');
            }
        } else {
            $.ajax({
                type: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                url: '/productinfo'
            }).done(function(data){
                if (data.ok){
                    var sizeIndex = data.pr.size.indexOf(size);
                    if (sizeIndex != -1){
                        if (Number(data.pr.number[sizeIndex]) > 0){

                            var basket = JSON.parse(sessionStorage.getItem('SHOPPING'));
                            if (!basket){
                                basket = {};
                            }

                            if (!basket[id]) {
                                $('.page_splin:eq(1)').append(
                                    `<div class="page_product" id="${id}">
                                        <div class="page_p_photo"><img src="${data.pr.photo[0]}" alt=""></div>
                                        <div class="page_p_name">
                                            <div class="page_p_n_text">${data.pr.name}</div>
                                            <div class="page_p_n_price">${data.pr.price} ₽</div>
                                            <div class="page_p_n_col">
                                                <div class="col_status col_minus">–</div>
                                                <div class="col_col">1</div>
                                                <div class="col_status col_plus">+</div>
                                            </div>
                                        </div>
                                        <div class="page_p_remove">
                                            <div class="col_status">×</div>
                                        </div>
                                    </div>`
                                );
                                var summ = Number($('.page_summa span').text().replace(/\D+/g,"")) + Number(data.pr.price);
                                $('.page_summa span').html(`${summ} ₽`);

                                basket[id] = {
                                    maxCol: data.pr.number[sizeIndex],
                                    price: data.pr.price,
                                    name: data.pr.name,
                                    col: 1,
                                    photo: data.pr.photo[0],
                                    size: '',
                                    code: data.pr.code,
                                    provider: data.pr.provider

                                }

                                sessionStorage.setItem('SHOPPING', JSON.stringify(basket));
                                sessionStorage.setItem('SUMMA', JSON.stringify(summ));
                                

                                $('#count_product').text(Number($('#count_product').text()) + 1);
                                $('#count_product').show();

                            }

                            $('.page_basket').show();
                            $('.page_basket').animate({'opacity': 1}, 500);
                            $('.modal_block').hide();
                        }
                    }

                } else {
                    alert('Попробуйте позже. Сервис временно недоступен!');
                }
            });
        }

    });

    $('#continue_shop').on('click', (e) => {
        $('.page_basket').hide();
        $('body, html').css('overflow-y', 'auto');
    });
    $('#close_menu').on('click', (e) => {
        $('.page_menu_main').hide(100);
        $('body, html').css('overflow-y', 'auto');
    })
    $('.burger_menu img').on('click', (e) => {
        $('.page_menu_main').css('top', $(window).scrollTop());
        $('.page_menu_main').show(100);
        $('body, html').css('overflow-y', 'hidden');
    })

    $('#saveEdit').on('click', (e) => {

        var sizeArr = [];
        var colArr = [];
        var sizeCl = $('.size_all_row');

        for (var i=0; i < sizeCl.length; i++){
            var sz = $(`.size_all_row:eq(${i}) .middle_input:eq(0)`).val();
            var cl = $(`.size_all_row:eq(${i}) .middle_input:eq(1)`).val();
            if (sz && sz == 'Без размера' && cl){
                sizeArr.push("");
                colArr.push(cl);
            } else if (sz && sz != "Без размера" && cl){
                sizeArr.push(sz);
                colArr.push(cl);
            } else {
                if (cl) {
                    sizeArr.push("");
                    colArr.push(cl);
                } else {
                    alert("Количество товара не может быть пустым, поставьте 0");
                }
            }
        }

        var data = {
            id: $('#id_prod').text(),
            provider: $('#providerProduct').val(),
            name: $('#nameProduct').val(),
            code: $('#codeProduct').val(),
            price: $('#priceProduct').val(),
            size: sizeArr,
            col: colArr
        }

        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: '/saveedit'
        }).done(function(data){
            if (data.ok){
                alert("Данные сохранены!");
            } else {
                alert('Не удалось сохранить, попробуйте позже!');
            }
        });

    });

    $('.all_foto').dblclick((e) => {
        if(e.target.tagName == "IMG"){
            var datas = {
                id: $('#id_prod').text(),
                img: $(e.target).attr('src')
            }

            $(e.target.parentElement).remove();

            $.ajax({
                type: 'POST',
                data: JSON.stringify(datas),
                contentType: 'application/json',
                url: '/removefoto'
            }).done(function(data){
                if (data.ok){
                    var photo = $('.all_item:eq(0) img').attr('src');
                    $('.pr_info_foto').html('');
                    if (photo) {
                        $('.pr_info_foto').html(`<img src="${photo}" alt="">`);
                    }
                    $('.all_item').removeClass('all_item_active');
                    $('.all_item:eq(0)').addClass('all_item_active');

                    if ($('.all_item').length == 1) {
                        $.ajax({
                            type: 'POST',
                            data: JSON.stringify(datas),
                            contentType: 'application/json',
                            url: '/editstatus'
                        }).done(function(data){
                            if (!data.ok){
                                alert('Ошибка при снятии товара с продажи!');
                            }
                        })
                    }
                } else {
                    alert('Не удалось удалить фото, попробуйте позже!');
                }
            });

        }
    });

    $('#upload_data_gh').on('click', (e) => {

        //alert("В разработке... Уже готово! Для безопасности отключено!");

        $('.load_data_admin').show();

        $.ajax({
            type: 'POST',
            url: '/insertproducts'
        }).done(function(data){
            if (!data.ok){
                $('.load_data_admin').hide();
                alert('Не удалось загрузить товары. Попробуйте позже...');
            } else {
                setTimeout(() => {location.reload();}, 2000);
            }
        });
    })
    $('#delete_products').on('click', (e) => {
        $('#delete_products_modal').show();
        $('body, html').css('overflow', "hidden");
    });

    var filter = () => {
        var status = $('#filterStatus option:selected').text();
        var provider = $('#filterProvider option:selected').text();

        var table = $('#admin_table tbody tr');

        $('#admin_table tbody tr').hide();

        if (status == "Статус" && provider != "Поставщик"){
            for (var i=0; i < table.length; i++){
                if ($(`#admin_table tbody tr:eq(${i}) td:eq(1)`).text() == provider){
                    $(`#admin_table tbody tr:eq(${i})`).show();
                }
            }
        } else if (status != "Статус" && provider == "Поставщик"){
            for (var i=0; i < table.length; i++){
                if ($(`#admin_table tbody tr:eq(${i}) td:eq(5)`).text() == status){
                    $(`#admin_table tbody tr:eq(${i})`).show();
                }
            }
        } else if (status != "Статус" && provider != "Поставщик") {
            for (var i=0; i < table.length; i++){
                if ($(`#admin_table tbody tr:eq(${i}) td:eq(5)`).text() == status && $(`#admin_table tbody tr:eq(${i}) td:eq(1)`).text() == provider){
                    $(`#admin_table tbody tr:eq(${i})`).show();
                }
            }
        } else if (status == "Статус" && provider == "Поставщик") {
            $(`#admin_table tbody tr`).show();
        }
    }

    $('#filterProvider').on('change', (e) => {
        filter();
    });
    $('#filterStatus').on('change', (e) => {
        filter();
    });

    $('#modalDelete').on('click', (e) => {
        var data = {
            provider: $('#deletedProvider option:selected').text()
        }

        $('.load_data_admin').show();

        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: '/deleteproducts'
        }).done(function(data){
            if (!data.ok){
                $('.load_data_admin').hide();
                alert('Не удалось удалить товары. Попробуйте позже...');
            } else {
                location.reload();
            }
        });

    });

    $(document).delegate( ".filter_block ul li", "click", (e) => {
        $('.filter_block ul li').removeAttr('id');
        $(e.target).attr('id', 'active_provider');

        var provider = $(e.target).text();

        var data = {
            provider
        }

        $('.products_block').text('');
        
        $.ajax({
            type: 'POST',
            data: JSON.stringify(data),
            contentType: 'application/json',
            url: '/findproductfromprovider'
        }).done(function(data){
            if (data.ok){

                var pr = data.pr;
                for(var r=0; r < data.pr.length; r+=4){
                    var row = `<div class="row_a">`;
                    var column = `<div class="column_a">`;
                    var product = '';
                    for (var c=r;c < r+2; c++) {
                        if (c < data.pr.length) {
                            product += `
                            <div class="product"> 
                                <div class="block_foto"> 
                                    <img src="${pr[c].photo[0]}" alt=""> 
                                </div> 
                                <span class="brend">${pr[c].provider}</span> 
                                <p>${pr[c].name}</p> 
                                <span class="price">${pr[c].price} ₽</span> 
                                <button class="in_basket" id="${pr[c].id}">Подробнее</button> 
                            </div> 
                            `
                        } else {
                            break;
                        }
                    }
                    column += product + '</div>'
                    row += column;

                    column = `<div class="column_a">`;
                    product = '';

                    for (var c=r+2; c < r+4; c++){
                        if (c < data.pr.length) {
                            product += `
                            <div class="product"> 
                                <div class="block_foto"> 
                                    <img src="${pr[c].photo[0]}" alt=""> 
                                </div> 
                                <span class="brend">${pr[c].provider}</span> 
                                <p>${pr[c].name}</p> 
                                <span class="price">${pr[c].price} ₽</span> 
                                <button class="in_basket" id="${pr[c].id}">Подробнее</button> 
                            </div> 
                            `
                        } else {
                            break;
                        }
                    }

                    column += product + '</div>'
                    row += column;

                    $('.products_block').append(row);

                }

            } else {
                console.log(data);
            }
        });
        
    })

    $('#provider_li').on('click', (e) => {
        if (e.target.className != 'prov_item_li') {
            if ($('#provider_li span').text() == '+') {
                $('#provider_li span').text('-');
                $('#provider_li ul').show(100);
            } else {
                $('#provider_li span').text('+');
                $('#provider_li ul').hide(100);
            }
        } else {
            $('.page_menu_main').hide();
            $('body, html').css('overflow', 'auto');

            var provider = $(e.target).text();

            var data = {
                provider
            }

            $('.products_block').text('');
            $('#provider_li ul li').removeAttr('id');
            $(e.target).attr('id', 'active_provider');
            
            $.ajax({
                type: 'POST',
                data: JSON.stringify(data),
                contentType: 'application/json',
                url: '/findproductfromprovider'
            }).done(function(data){
                if (data.ok){

                    var pr = data.pr;
                    for(var r=0; r < data.pr.length; r+=4){
                        var row = `<div class="row_a">`;
                        var column = `<div class="column_a">`;
                        var product = '';
                        for (var c=r;c < r+2; c++) {
                            if (c < data.pr.length) {
                                product += `
                                <div class="product"> 
                                    <div class="block_foto"> 
                                        <img src="${pr[c].photo[0]}" alt=""> 
                                    </div> 
                                    <span class="brend">${pr[c].provider}</span> 
                                    <p>${pr[c].name}</p> 
                                    <span class="price">${pr[c].price} ₽</span> 
                                    <button class="in_basket" id="${pr[c].id}">Подробнее</button> 
                                </div> 
                                `
                            } else {
                                break;
                            }
                        }
                        column += product + '</div>'
                        row += column;

                        column = `<div class="column_a">`;
                        product = '';

                        for (var c=r+2; c < r+4; c++){
                            if (c < data.pr.length) {
                                product += `
                                <div class="product"> 
                                    <div class="block_foto"> 
                                        <img src="${pr[c].photo[0]}" alt=""> 
                                    </div> 
                                    <span class="brend">${pr[c].provider}</span> 
                                    <p>${pr[c].name}</p> 
                                    <span class="price">${pr[c].price} ₽</span> 
                                    <button class="in_basket" id="${pr[c].id}">Подробнее</button> 
                                </div> 
                                `
                            } else {
                                break;
                            }
                        }

                        column += product + '</div>'
                        row += column;

                        $('.products_block').append(row);

                    }

                } else {
                    console.log(data);
                }
            });
        }

    });
    
});
