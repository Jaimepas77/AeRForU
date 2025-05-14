const { isAC, isTried, getUserID, getLastError, getProblemCategories, getCategoryData } = require('./getters');

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

test('getCategoryData: category 6', async () => {
    const ret = await getCategoryData(6);
    expect(ret.name).toBe('Bucles simples');
    expect(ret.desc).toBe('for\'s, while\'s o do-while\'s sin anidamiento.');
});
