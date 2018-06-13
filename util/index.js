
let fs = require('fs');
let path = require('path');
const NEWLINE = '\r\n';

/**
 * 生成block完成后的回调函数中把新生成的block加入到 src/router/index.js 和 src/menu-config.json 中
 *
 * @param {Object} data 用户输入数据
 */
exports.addToRouter = function (data) {
    let srcPath = path.join(process.cwd(), '../../');
    try {
        reWriteRouter(path.join(srcPath, './router/index.js'), data);
        reWriteMenu(path.join(srcPath, './menu-config.json'), data);
    }
    catch (e) {
        console.log(e);
    }
};

/**
 * 写入 ./router/index.js
 *
 * @param {string} filePath 文件地址
 * @param {Object} data 用户输入数据
 */
function reWriteRouter(filePath, data) {
    let tpl = fs.readFileSync(filePath, 'utf-8');
    // 找 `routes = [` 匹配的 `]` 作为 endPos
    const startString = 'routes = [';
    let startPos = tpl.indexOf(startString) + startString.length - 1;
    let endPos = findPairBracket(tpl.slice(startPos)) + startPos;

    let newRouterItem = [
        ', {',
        '    path: \'/${destDirName}\',',
        '    name: \'${name}\',',
        '    component: () => import(\'@/materials/blocks/${destDirName}/src\')',
        '}'
    ];
    newRouterItem = newRouterItem.join(NEWLINE);
    newRouterItem = renderTemplateString(newRouterItem, data);
    let res = tpl.slice(0, endPos)
        + newRouterItem
        + tpl.slice(endPos);

    fs.writeFileSync(filePath, res);
}

/**
 * 写入 src/menu-config.json
 *
 * @param {string} filePath 文件地址
 * @param {Object} data 用户输入数据
 */
function reWriteMenu(filePath, data) {
    let menuArray = require(filePath);

    let newMenuItem = {
        name: data.name,
        path: data.destDirName,
        disabled: false
    };

    let newCategoryItem = {
        name: data.categories,
        disabled: true,
        children: [{
            name: data.name,
            path: data.destDirName,
            disabled: false
        }]
    };

    let categories = data.categories; // categories 目前是单选，应该叫category
    let isExist = false;
    menuArray.forEach(item => {
        if (item.name === categories) {
            isExist = true;
            item.children.push(newMenuItem);
        }
    });
    // 新category则创建一级菜单
    if (!isExist) {
        menuArray.push(newCategoryItem);
    }

    let res = JSON.stringify(menuArray, null, 4);
    fs.writeFileSync(filePath, res);
}

/**
 * 找到与第一个 `[` 匹配的 `]`
 *
 * @param {string} s 待查找字符串
 * @return {number} i 匹配的 `]` 的下标
 */
function findPairBracket(s) {
    let index = 0;
    for (let i = 0, len = s.length; i < len; i++) {
        if (s[i] === '[') {
            index++;
        }
        else if (s[i] === ']') {
            index--;
            if (!index) {
                return i;
            }
        }
    }
}

/**
 * 简易渲染 ES6 字符串模板
 *
 * @param {string} tpl 模板
 * @param {Object} opts 数据
 * @return {string} value
 */
function renderTemplateString(tpl, opts) {
    let reg = /\${\s*(\w+)\s*}/mg;
    let result;
    while ((result = reg.exec(tpl)) !== null) {
        if (result.length === 2 && typeof opts[result[1]] !== 'undefined') {
            tpl = tpl.replace(result[0], opts[result[1]]);
            reg.lastIndex = 0;
        }
    }
    return tpl;
}

/**
 * 日期格式化
 *
 * @param {Date} date 日期对象
 * @param {string} fmt 格式，如：yyyy-mm-dd
 *
 * @return {string} value
 */
exports.formatDate = function (date, fmt = 'yyyy-MM-dd') {
    let o = {
        'M+': date.getMonth() + 1,
        'd+': date.getDate(), // 日
        'h+': date.getHours(), // 小时
        'm+': date.getMinutes(), // 分
        's+': date.getSeconds(), // 秒
        'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
        'S': date.getMilliseconds() // 毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
    }
    for (let k in o) {
        if (new RegExp('(' + k + ')').test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1)
                    ? (o[k]) : (('00' + o[k]).substr(('' + o[k]).length)));
        }
    }
    return fmt;
};
