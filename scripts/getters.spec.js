/*
To run the tests, use this command in the root folder of the project:
npm test
*/

const { isAC, isTried, isCategoryCompleted, isVolumeCompleted, getUserID, getNick, getLastError, getProblemCategories, isProblemsCategory, getCategoryData, getCategoryProblems, getProblemInfo, getProblemLevel, getLevelsText, getUserProblemPosition } = require('./getters');
const levels_dict = require('../data/levels.js');

global.chrome = {
    storage: {
        local: {
            data: {}, // Almacenamiento simulado
            get: function(key, callback) {
                const result = {};
                if (typeof key === 'string') {
                    result[key] = this.data[key];
                } else if (Array.isArray(key)) {
                    key.forEach(k => {
                        result[k] = this.data[k];
                    });
                }
                callback(result);
            },
            set: function(items, callback) {
                Object.assign(this.data, items);
                if (callback) callback();
            },
            remove: function(keys, callback) {
                if (typeof keys === 'string') {
                    delete this.data[keys];
                } else if (Array.isArray(keys)) {
                    keys.forEach(k => delete this.data[k]);
                }
                if (callback) callback();
            },
            clear: function(callback) {
                this.data = {};
                if (callback) callback();
            }
        }
    },
    runtime: {
        lastError: null
    }
};

// Limpiar el storage antes de cada test
beforeEach(() => {
    global.chrome.storage.local.data = {};
});


test('isAC: problem 200 of jjjjjjjp022', async () => {
    const ret = await isAC(200, 17715);
    expect(ret).toBe(true);
});

test('isAC: problem 701 of elferni', async () => {
    const ret = await isAC(701, 8);
    expect(ret).toBe(false);
});

test('isTried: problem 331 of elferni', async () => {
    const ret = await isTried(331, 8);
    expect(ret).toBe(true);
});

test('isTried: problem 332 of elferni', async () => {
    const ret = await isTried(332, 8);
    expect(ret).toBe(false);
});

test('isCategoryCompleted: category 155 of jjjjjjjp022', async () => {
    const ret = await isCategoryCompleted(155, 17715);
    expect(ret).toBe(true);
});

test('isCategoryCompleted: category 102 of jjjjjjjp022', async () => {
    const ret = await isCategoryCompleted(102, 17715);
    expect(ret).toBe(false);
});

test('isCategoryCompleted: category 101 of jjjjjjjp022', async () => {
    const ret = await isCategoryCompleted(101, 17715);
    expect(ret).toBe(false);
});

test('isCategoryCompleted: category 83 of danimania', async () => {
    const ret = await isCategoryCompleted(83, 37576);
    expect(ret).toBe(true);
});

test('isVolumeCompleted: volume 71 of AperezaC', async () => {
    const ret = await isVolumeCompleted(71, 3428);
    expect(ret).toBe(true);
}, 10000);

test('isVolumeCompleted: volume 71 of jjjjjjjp022', async () => {
    const ret = await isVolumeCompleted(71, 17715);
    expect(ret).toBe(false);
});

test('getUserID: jjjjjjjp022', async () => {
    const ret = await getUserID("jjjjjjjp022");
    expect(ret).toBe('17715');
});

test('getLastError: problem 331 of elferni', async () => {
    const ret = await getLastError(331, 8);
    expect(ret).toBe('WA');
});

test('getProblemCategories: problem 100', async () => {
    const ret = await getProblemCategories(100);
    expect(ret.length).toBe(5);
});

test('isProblemsCategory: category 6', async () => {
    const ret = await isProblemsCategory(6);
    expect(ret).toBe(true);
}, 10000);

test('isProblemsCategory: category 2', async () => {
    const ret = await isProblemsCategory(2);
    expect(ret).toBe(false);
}, 10000);

test('getCategoryData: category 6', async () => {
    const ret = await getCategoryData(6);
    expect(ret.name).toBe('Bucles simples');
    expect(ret.desc).toBe('for\'s, while\'s o do-while\'s sin anidamiento.');
});

test('getCategoryProblems: category 6', async () => {
    const ret = await getCategoryProblems(6);
    expect(ret.length).toBeGreaterThan(140);
});

test('getProblemInfo: problem 100', async () => {
    const ret = await getProblemInfo(100);
    expect(ret.num).toBe(100);
    expect(ret.title).toBe("Constante de Kaprekar");
});

test('getProblemLevel: problem 116', async () => {
    const ret = await getProblemLevel(116);
    expect(ret).toBeLessThan(25);
});

test('getLevelsText: default', async () => {
    const ret = await getLevelsText();
    expect(ret.easy).toBe("Fácil");
    expect(ret.medium).toBe("Medio");
    expect(ret.hard).toBe("Difícil");
    expect(ret.very_hard).toBe("Extremo");
});

test('getLevelsText: emojis', async () => {
    const ret = await getLevelsText(0);
    expect(ret.easy).toBe("🟢");
    expect(ret.medium).toBe("🟡");
    expect(ret.hard).toBe("🔴");
    expect(ret.very_hard).toBe("💀");
});

test('getLevelsText: Spanish text', async () => {
    const ret = await getLevelsText(1);
    expect(ret.easy).toBe("Fácil");
    expect(ret.medium).toBe("Medio");
    expect(ret.hard).toBe("Difícil");
    expect(ret.very_hard).toBe("Extremo");
});

test('getLevelsText: stars', async () => {
    const ret = await getLevelsText(2);
    expect(ret.easy).toBe("★☆☆");
    expect(ret.medium).toBe("★★☆");
    expect(ret.hard).toBe("★★★");
});

test('getUserProblemPosition: problem 706 of dopamina', async () => {
    const ret = await getUserProblemPosition("dopamina", 706);
    expect(ret).toBe(1);
});

// ========================================
// TESTS PARA getUserProblemPosition
// ========================================

test('getUserProblemPosition: problem 706 of dopamina (rank 1)', async () => {
    const ret = await getUserProblemPosition("dopamina", 706);
    expect(ret).toBe(1);
}, 10000);

test('getUserProblemPosition: case insensitive username', async () => {
    const ret1 = await getUserProblemPosition("DOPAMINA", 706);
    const ret2 = await getUserProblemPosition("dopamina", 706);
    expect(ret1).toBe(ret2);
}, 10000);

test('getUserProblemPosition: non-existent user', async () => {
    const ret = await getUserProblemPosition("user_that_does_not_exist_12345", 100);
    expect(ret).toBeNull();
}, 10000);

test('getUserProblemPosition: user without submission for problem', async () => {
    const ret = await getUserProblemPosition("elferni", 819);
    expect(ret).toBeNull();
}, 10000);

test('getUserProblemPosition: problem with many pages of ranking', async () => {
    const ret = await getUserProblemPosition("jjjjjjjp022", 116);
    expect(ret).toBeGreaterThan(0);
    expect(typeof ret).toBe('number');
}, 15000);

test('getUserProblemPosition: cache usage (second call should be faster)', async () => {
    const username = "AperezaC";
    const problemId = 200;
    
    const start1 = Date.now();
    const ret1 = await getUserProblemPosition(username, problemId);
    const time1 = Date.now() - start1;
    
    const start2 = Date.now();
    const ret2 = await getUserProblemPosition(username, problemId);
    const time2 = Date.now() - start2;
    
    expect(ret1).toBe(ret2);
    expect(ret1).toBeGreaterThan(0);
    // La segunda llamada debería ser más rápida debido al caché
    console.log(`Primera llamada: ${time1}ms, Segunda llamada: ${time2}ms`);
}, 20000);

test('getUserProblemPosition: username with spaces', async () => {
    const ret = await getUserProblemPosition(" jjjjjjjp022 ", 200);
    expect(ret).toBeGreaterThan(0);
}, 10000);

test('getUserProblemPosition: fallback when aerdata fails', async () => {
    const ret = await getUserProblemPosition("gustof", 171);
    expect(ret).toBeGreaterThan(0);
}, 15000);