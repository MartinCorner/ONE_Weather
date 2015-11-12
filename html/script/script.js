$(document).ready(function(){
    window.ONE_WEATHER = {};
    ONE_WEATHER.version = '0.0.1';
    ONE_WEATHER.weather_data = {};
    ONE_WEATHER.isSync = false;
    ONE_WEATHER.tools = {};
    ONE_WEATHER.tools.nowDate;
    
    ONE_WEATHER.tools.utcToLocal = function(utcTime) { 
        if(utcTime==='0000-00-00 00:00:00' || utcTime===null || utcTime==='' || utcTime===undefined) 
            return utcTime; 
        var locTime = new Date();
        utcTime=utcTime.replace("-", "/").replace("-", "/"); //火狐不兼容'-'分隔日期 
        //解析字符串及本地时间赋值 
        locTime.setTime(Date.parse(utcTime)-locTime.getTimezoneOffset()*60000); 
        //本地时间字符串格式化 
        var year = locTime.getFullYear(); 
        var month = (locTime.getMonth()+1); 
        var date = ONE_WEATHER.tools.preZero(locTime.getDate()); 
        var hour = ONE_WEATHER.tools.preZero(locTime.getHours()); 
        var minute = ONE_WEATHER.tools.preZero(locTime.getMinutes()); 
        var second = ONE_WEATHER.tools.preZero(locTime.getSeconds()); 
        return year+'-'+month+'-'+date+' '+hour+':'+minute+':'+second; 
    } 
    ONE_WEATHER.tools.preZero = function(str) { 
        return str.toString().length < 2 ? '0'+str : str; 
    } 
    ONE_WEATHER.tools.getNowDate = function(){
        if(ONE_WEATHER.tools.nowDate == undefined){
            ONE_WEATHER.tools.nowDate = new Date();
        }
        return ONE_WEATHER.tools.nowDate;
    }
    
    ONE_WEATHER.send_heweather = function(){
        $.post(
            'https://api.heweather.com/x3/weather',
            {
                city:'shanghai',
                key:'84865ed822e74a1d8583eaf7e535976c'
            },
            function(result){
                ONE_WEATHER.weather_data.aqi = result['HeWeather data service 3.0'][0].aqi;
                ONE_WEATHER.weather_data.basic = result['HeWeather data service 3.0'][0].basic;
                ONE_WEATHER.weather_data.now = result['HeWeather data service 3.0'][0].now;
                ONE_WEATHER.weather_data.daily_forecast = result['HeWeather data service 3.0'][0].daily_forecast;
                ONE_WEATHER.weather_data.hourly_forecast = result['HeWeather data service 3.0'][0].hourly_forecast;
                console.log('HeWeather data:');
                console.log(result['HeWeather data service 3.0'][0]);
                
                ONE_WEATHER.isSync = true;
                ONE_WEATHER.sync_weather_data();
            }
        );
    }
    
    ONE_WEATHER.send_openweathermap = function(city_name){
        $.post(
            'http://api.openweathermap.org/data/2.5/forecast?q='+city_name+'&mode=json&appid=6b3cf8a3af6afcf28e812088148bfaa4',
            function(result){
//                ONE_WEATHER.weather_data.openweathermap_list = {};
                ONE_WEATHER.weather_data.openweathermap_list = result.list;
                
                console.log('openweathermap data:');
                console.log(result);
                ONE_WEATHER.send_heweather();
            }
        );
    }
    
    ONE_WEATHER.get_weather_data = function(){
        var flag = false;
        if(localStorage['ONE_WEATHER-weather_data'] && localStorage['ONE_WEATHER-update_date']){
            if((ONE_WEATHER.tools.getNowDate()).getTime() - localStorage['ONE_WEATHER-update_date'] <= 43200000 && localStorage['ONE_WEATHER-weather_data']!=""){       //exceed 24 hours
                ONE_WEATHER.weather_data = JSON.parse(localStorage['ONE_WEATHER-weather_data']);
                ONE_WEATHER.load_weather_data();
            }else{
                ONE_WEATHER.sync_weather_data();
            }
        }else{
            ONE_WEATHER.sync_weather_data();
        }
    }
    
    ONE_WEATHER.sync_weather_data = function(){
//        ONE_WEATHER.weather_data = window.ONE_WEATHER_test;
        if(ONE_WEATHER.isSync == false){
//            ONE_WEATHER.send_openweathermap('shanghai,china');
            ONE_WEATHER.send_openweathermap('shanghai, CN');
        }else{
            
            localStorage['ONE_WEATHER-weather_data'] = JSON.stringify(ONE_WEATHER.weather_data);
            localStorage['ONE_WEATHER-update_date'] = (ONE_WEATHER.tools.getNowDate()).getTime();
            ONE_WEATHER.get_weather_data();
        }
    }
    
    ONE_WEATHER.load_weather_data = function(){
        $('.location').html(ONE_WEATHER.weather_data.basic.city+'·'+ONE_WEATHER.weather_data.basic.cnty);
        $('.now_weather img').attr('src','http://files.heweather.com/cond_icon/'+ONE_WEATHER.weather_data.now.cond.code+'.png');
        $('.now_weather .cond_text').html(ONE_WEATHER.weather_data.now.cond.txt);
        $('.now_weather .tmp').html(ONE_WEATHER.weather_data.now.tmp+'℃');
        $('.now_weather .aqi').html(ONE_WEATHER.weather_data.aqi.city.aqi);
        $('.now_weather .max_temperature').html('↑'+ONE_WEATHER.weather_data.daily_forecast[0].tmp.max+'℃');
        $('.now_weather .min_temperature').html('↓'+ONE_WEATHER.weather_data.daily_forecast[0].tmp.min+'℃');
        
        var weather_aqi = parseInt(ONE_WEATHER.weather_data.aqi.city.aqi);
        if(0 <= weather_aqi && weather_aqi <= 50){
            $('.now_weather .aqi')[0].className = "aqi aqi_1";
        }else if(51 <= weather_aqi && weather_aqi <= 100){
            $('.now_weather .aqi')[0].className = "aqi aqi_2";
        }else if(101 <= weather_aqi && weather_aqi <= 150){
            $('.now_weather .aqi')[0].className = "aqi aqi_3";
        }else if(151 <= weather_aqi && weather_aqi <= 200){
            $('.now_weather .aqi')[0].className = "aqi aqi_4";
        }else if(201 <= weather_aqi && weather_aqi <= 300){
            $('.now_weather .aqi')[0].className = "aqi aqi_5";
        }else if(301 <= weather_aqi){
            $('.now_weather .aqi')[0].className = "aqi aqi_6";
        }
        
        var daily_forecast_date = [];
        var daily_forecast_tmp = [];
        var daily_forecast_rain = [];
        var has_rain = false;
        
        if(ONE_WEATHER.weather_data.openweathermap_list[0].rain)
            has_rain = true;
        
        for(var i=0;i<(ONE_WEATHER.weather_data.openweathermap_list.length >= 9 ? 9 : ONE_WEATHER.weather_data.openweathermap_list.length);i++){
            daily_forecast_date[i] = ONE_WEATHER.tools.utcToLocal(ONE_WEATHER.weather_data.openweathermap_list[i].dt_txt).split(' ')[1];
            daily_forecast_tmp[i] = parseInt((ONE_WEATHER.weather_data.openweathermap_list[i].main.temp-273.15));
            if(has_rain)
                daily_forecast_rain[i] = ONE_WEATHER.weather_data.openweathermap_list[i].rain['3h'];
        }
//        for(var i=0;i<ONE_WEATHER.weather_data.daily_forecast.length;i++){
//            $('.daily_forecast > div:nth-child('+i+') .date').html(ONE_WEATHER.weather_data.daily_forecast[i].cond.date);
//            $('.daily_forecast > div:nth-child('+i+') img').attr('src','http://files.heweather.com/cond_icon/'+ONE_WEATHER.weather_data.daily_forecast[i].cond.code_d+'.png');
//            $('.daily_forecast > div:nth-child('+i+') .max_temperature').html(ONE_WEATHER.weather_data.daily_forecast[i].tmp.max+'℃');
//            $('.daily_forecast > div:nth-child('+i+') .min_temperature').html(ONE_WEATHER.weather_data.daily_forecast[i].tmp.min+'℃');
//        }
        var daily_forecast_num = 1;
        for(var i=1;i<ONE_WEATHER.weather_data.openweathermap_list.length;i++){
            if(i%8 == 0){
//                console.log(ONE_WEATHER.weather_data.openweathermap_list[i]);
                $('.daily_forecast > .daily_forecast_card:nth-child('+daily_forecast_num+') .date').html(ONE_WEATHER.weather_data.openweathermap_list[i].dt_txt.split(' ')[0]);
                $('.daily_forecast > .daily_forecast_card:nth-child('+daily_forecast_num+') .main_weather').html(ONE_WEATHER.weather_data.openweathermap_list[i].weather[0].main);
                $('.daily_forecast > .daily_forecast_card:nth-child('+daily_forecast_num+') .max_temperature').html(parseInt(ONE_WEATHER.weather_data.openweathermap_list[i].main.temp_max-273.15)+'℃');
                $('.daily_forecast > .daily_forecast_card:nth-child('+daily_forecast_num+') .min_temperature').html(parseInt(ONE_WEATHER.weather_data.openweathermap_list[i].main.temp_min-273.15)+'℃');
                daily_forecast_num++;
            }
        }
        
        var myChart = echarts.init($('.hourly_forecast #canvas')[0]);
        option = {
            calculable : false,
            grid :{
                x: 12,
                y: 24,
                x2: 24,
                y2: 24
            },
            xAxis : [
                {
                    type : 'category',
                    boundaryGap : true,
                    data: daily_forecast_date
                }
            ],
            yAxis : [
                {
                    show: false,
                    type : 'value',
                    boundaryGap : [0, 1],
//                    max: 20,
                    scale: true
                },
                {
                    show: false,
                    type : 'value',
                    boundaryGap : [0, 1],
//                    max: 20,
                    scale: true
                }
            ],
            series : [
                {
                    yAxisIndex:1,
                    name:'最高气温',
                    type:'line',
                    data: daily_forecast_tmp,
                    smooth : true,
                    symbol : 'emptyCircle',
                    itemStyle: {
                        normal: {
                            color: '#ff7f50',
                            label:{
                                show: true,
                                formatter: '{c}℃'
                            }
                        }
                    }
                },
                {
                    name:'降水',
                    type:'line',
                    data: daily_forecast_rain,
                    smooth : true,
                    symbol : 'droplet',
                    itemStyle: {
                        normal: {
                            color: '#50d7ff',
                            label:{
                                show: true,
                                formatter: '{c}mm'
                            }
                        }
                    }
                }
            ]
        };
                    
        
        myChart.setOption(option);    
    
        
        $('.daily_forecast .daily_forecast_card').click(function(event){
            var date_num = parseInt($(event.currentTarget).attr('data-num')),
                open_num = parseInt($('.daily_forecast .open.daily_forecast_card[data-num]').attr('data-num'));

            $('.daily_forecast .daily_forecast_card[data-num='+date_num+']').bind('webkitTransitionEnd',function(){
                window.setTimeout(function(){
                    window.transition_lock = false;
                },500);
            });
            if(!window.transition_lock){
                for(var i=2;i<$('.daily_forecast .daily_forecast_card[data-num]').length+1;i++){
                    $('.daily_forecast .daily_forecast_card[data-num]').removeClass('open');
                    $('.daily_forecast .daily_forecast_card[data-num='+date_num+']').addClass('open');
//                        console.log($('.daily_forecast .daily_forecast_card[data-num='+[i]+']'));
//                        if($('.daily_forecast .daily_forecast_card[data-num='+(date_num-1)+']').hasClass('open')){
                    if(i<=date_num){
                        window.transition_lock = true;
                        $('.daily_forecast .daily_forecast_card[data-num='+i+']').css('transform','translateY(-'+100*(i-1)+'px)');
                        $('.daily_forecast .daily_forecast_card[data-num='+(i-1)+'] .circle').css('transform','translateY(100px)');
//                                window.setTimeout(function(){
                            $('.daily_forecast .daily_forecast_card[data-num='+date_num+'] .circle').css('transform','translateY(0px)');
//                                },170);
                    }
                    if(i>date_num){
                        window.transition_lock = true;
                        $('.daily_forecast .daily_forecast_card[data-num='+i+']').css('transform','translateY(-'+100*(i-2)+'px)');
                    }
                }
            }
        });
        
        $('.detail_forecast #vis').html("能见度： "+ONE_WEATHER.weather_data.now.vis+" km");
        $('.detail_forecast #pres').html("气压： "+ONE_WEATHER.weather_data.now.pres+"hPa");
        $('.detail_forecast #wind_dir').html(ONE_WEATHER.weather_data.now.wind.dir);
        $('.detail_forecast #wind_spd').html(ONE_WEATHER.weather_data.now.wind.spd+"km/h");
        $('.detail_forecast #hum').html("湿度： "+ONE_WEATHER.weather_data.now.hum+"％");
        $('.detail_forecast #fl').html("体感温度： "+ONE_WEATHER.weather_data.now.fl+"℃");
        $('.detail_forecast #astro_sr').html("日出： "+ONE_WEATHER.weather_data.daily_forecast[0].astro.sr);
        $('.detail_forecast #astro_ss').html("日落： "+ONE_WEATHER.weather_data.daily_forecast[0].astro.ss);
        
        sunPostion();
        function sunPostion(){
            var sr_suntime = after_time(ONE_WEATHER.weather_data.daily_forecast[0].astro.sr.split(":")[0], ONE_WEATHER.weather_data.daily_forecast[0].astro.sr.split(":")[1]);
            var ss_suntime = after_time(ONE_WEATHER.weather_data.daily_forecast[0].astro.ss.split(":")[0], ONE_WEATHER.weather_data.daily_forecast[0].astro.ss.split(":")[1]);
            var suntime = ss_suntime-sr_suntime;
            var aftertime = after_time(ONE_WEATHER.tools.getNowDate().getHours(),ONE_WEATHER.tools.getNowDate().getMinutes())-sr_suntime;
//            $('.detail_forecast .sun-panel .sun-container #sun').css('left',(aftertime/suntime)*100+'%');
            
            var times = ((aftertime/suntime)*180)-90;
            var a = 130,
                b = 130,
                r = 133;
            var rad = (2 * Math.PI / 360) * 1 * times;
            var X = a + Math.sin(rad) * r;
            var Y = b - Math.cos(rad) * r;
            $('.detail_forecast .sun-panel .sun-container #sun').css('left',X+'px').css('top',Y+'px');
        }
        function after_time(now_hours, now_minutes){
            return (parseInt(now_hours)*60)+parseInt(now_minutes);
        }
        
        if(ONE_WEATHER.weather_data.now.wind.spd < 1){
            $('.detail_forecast #windmill')[0].className = "bladespeed-1";
        }else if(ONE_WEATHER.weather_data.now.wind.spd < 11){
            $('.detail_forecast #windmill')[0].className = "bladespeed-2";
        }else if(ONE_WEATHER.weather_data.now.wind.spd < 28){
            $('.detail_forecast #windmill')[0].className = "bladespeed-3";
        }else if(ONE_WEATHER.weather_data.now.wind.spd < 49){
            $('.detail_forecast #windmill')[0].className = "bladespeed-4";
        }else if(ONE_WEATHER.weather_data.now.wind.spd < 74){
            $('.detail_forecast #windmill')[0].className = "bladespeed-5";
        }else if(ONE_WEATHER.weather_data.now.wind.spd < 102){
            $('.detail_forecast #windmill')[0].className = "bladespeed-6";
        }else if(ONE_WEATHER.weather_data.now.wind.spd < 117){
            $('.detail_forecast #windmill')[0].className = "bladespeed-7";
        }else{
            $('.detail_forecast #windmill')[0].className = "bladespeed-8";
        }
        
            
    }
    
    ONE_WEATHER.init = function(){
        ONE_WEATHER.tools.getNowDate();
        ONE_WEATHER.get_weather_data();

        $('#button').bind('click',function(){
            ONE_WEATHER.isSync = false;
            ONE_WEATHER.sync_weather_data();
        });
        
	}
    
    ONE_WEATHER.init();
});
