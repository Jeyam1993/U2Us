const{defineConfig,devices}=require('@playwright/test');
module.exports=defineConfig({testDir:'tests/e2e',timeout:45000,retries:process.env.CI?1:0,reporter:[['list'],['html',{open:'never'}]],
 use:{baseURL:'http://localhost:3100',screenshot:'on',trace:'retain-on-failure'},
 webServer:{command:'node src/server.js',url:'http://localhost:3100/health',reuseExistingServer:!process.env.CI,env:{PORT:'3100',AUTH_LIMIT:'1000',GLOBAL_LIMIT:'100000'}},
 projects:[{name:'Android Pixel 5',use:{...devices['Pixel 5']}},{name:'iPhone 13 Safari',use:{...devices['iPhone 13']}},{name:'iPad Mini',use:{...devices['iPad Mini']}},
  {name:'Laptop Chrome',use:{...devices['Desktop Chrome']}},{name:'Laptop Firefox',use:{...devices['Desktop Firefox']}}]});
