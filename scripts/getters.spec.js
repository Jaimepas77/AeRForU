/*
To run the tests, use this command in the root folder of the project:
npm test
*/

const { isAC, isTried, isCategoryCompleted, isVolumeCompleted, getUserID, getNick, getLastError, getProblemCategories, isProblemsCategory, getCategoryData, getCategoryProblems, getProblemInfo, getProblemLevel, getLevelsText, getUserProblemPosition } = require('./getters');
const levels_dict = require('../data/levels.js');

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
