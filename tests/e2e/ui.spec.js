const{test,expect}=require('@playwright/test');
async function fill(p,o={}){const d={name:'Asha Rao',email:`pw${Date.now()}${Math.random().toString(36).slice(2,7)}@test.com`,phone:'+919876543210',age:'28',password:'LongPass#2026',...o};
 for(const k of['name','email','phone','age','password'])await p.fill(`[name=${k}]`,d[k]);await p.selectOption('[name=intent]','marriage');await p.check('[name=consent]');return d}
test('fits the screen: no sideways scroll, no console errors',async({page})=>{const errs=[];page.on('console',m=>m.type()==='error'&&errs.push(m.text()));page.on('pageerror',e=>errs.push(e.message));
 await page.goto('/');await expect(page.locator('h1')).toHaveText('U2Us');await expect(page.locator('#go')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);expect(errs).toEqual([])});
test('under-18 gets a clear error and no profile',async({page})=>{await page.goto('/');await fill(page,{age:'17'});await page.click('#go');await expect(page.locator('#err')).toContainText('18 or older');await expect(page.locator('#sum')).toBeHidden()});
test('register -> summary screen -> all 3 confirmations Sent',async({page})=>{await page.goto('/');const d=await fill(page);await page.click('#go');
 await expect(page.locator('#sum')).toBeVisible();await expect(page.locator('#sd')).toContainText('Asha Rao');await expect(page.locator('#sd')).not.toContainText(d.email);await expect(page.locator('#sd')).not.toContainText(d.phone);
 await expect(page.locator('#nl li').filter({hasText:'Sent'})).toHaveCount(3,{timeout:20000});
 await page.screenshot({path:`test-results/summary-${test.info().project.name.replace(/\W+/g,'-')}.png`,fullPage:true});
 await page.reload();await expect(page.locator('#sum')).toBeVisible()});
