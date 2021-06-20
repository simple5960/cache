export function serviceWorker(swPath:string)
{
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function (event) {
            navigator.serviceWorker.register(swPath, {
                    scope: '/'
                })
                .then(function (registeration) {
                    console.log('Service worker register success with scope ' + registeration.scope);
                });
        });

        navigator.serviceWorker.oncontrollerchange = function (event) {
        };

        // 如果用户处于断网状态进入页面，用户可能无法感知内容是过期，需要提示用户断网了，并在重新连接后告诉用户
        if (!window.navigator.onLine) {

            window.addEventListener('online', function () {
            });

        }
    }
}
export function cacheToLocalStorage(key:string,data:object)
{
    localStorage.setItem(key,JSON.stringify(data))
}
export function getDataFromLocalStorage(key:string):JSON | Array<null>{
    var data=localStorage.getItem(key);
    if(data!==null){
        //本地存储里面的数据字符串格式
        return JSON.parse(data);
    }
    else{
        return [];
    }
}
export function cacheToSessionStorage(key:string,data:object)
{
    sessionStorage.setItem(key,JSON.stringify(data))
}
export  function getDataFromSessionStorage(key:string):JSON | Array<null>{
    var data=sessionStorage.getItem(key);
    if(data!==null){
        //本地存储里面的数据字符串格式
        return JSON.parse(data);
    }
    else{
        return [];
    }
}