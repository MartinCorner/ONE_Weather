$(document).ready(function(){
    window.ONE_WEATHER = {};
    ONE_WEATHER.version = '0.0.1';
    ONE_WEATHER.weather_data = {};
    ONE_WEATHER.isSync = false;
    ONE_WEATHER.tools = {};
    
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
                
                console.log(result);
                ONE_WEATHER.send_heweather();
            }
        );
    }
    
    ONE_WEATHER.get_weather_data = function(){
        var flag = false;
        if(localStorage['ONE_WEATHER-weather_data'] && localStorage['ONE_WEATHER-update_date']){
            if((new Date()).getTime() - localStorage['ONE_WEATHER-update_date'] <= 86400000 && localStorage['ONE_WEATHER-weather_data']!=""){       //exceed 24 hours
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
            ONE_WEATHER.send_openweathermap('Rotterdam, NL');
        }else{
            
            localStorage['ONE_WEATHER-weather_data'] = JSON.stringify(ONE_WEATHER.weather_data);
            localStorage['ONE_WEATHER-update_date'] = (new Date()).getTime();
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
        for(var i=0;i<ONE_WEATHER.weather_data.daily_forecast.length;i++){
            $('.daily_forecast > div:nth-child('+i+') .date').html(ONE_WEATHER.weather_data.daily_forecast[i].cond.date);
            $('.daily_forecast > div:nth-child('+i+') img').attr('src','http://files.heweather.com/cond_icon/'+ONE_WEATHER.weather_data.daily_forecast[i].cond.code_d+'.png');
            $('.daily_forecast > div:nth-child('+i+') .max_temperature').html(ONE_WEATHER.weather_data.daily_forecast[i].tmp.max+'℃');
            $('.daily_forecast > div:nth-child('+i+') .min_temperature').html(ONE_WEATHER.weather_data.daily_forecast[i].tmp.min+'℃');
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
    
    }
    
    ONE_WEATHER.init = function(){
        ONE_WEATHER.get_weather_data();

        $('#button').bind('click',function(){
            ONE_WEATHER.isSync = false;
            ONE_WEATHER.sync_weather_data();
        });
        
	}
    
    ONE_WEATHER.init();
});
