module.exports = {
  site: {
    /**
     * The title of your site, which can be automatically
     * substituted.
     */
    title: 'VSAT ResQ',    
//title: 'Selfserve - DIY Web Server',
    description: 'Art & Design',
    basePath: process.env.NODE_ENV === 'production' ? '/nanogen' : '',

    /**
     * baseURL can be substituted in your template preconfigure your base URL. 
     */
    // baseURL: 'https://vsatresq.com/',
    baseURL: 'http://localhost:8001/',

    /**
     * The default layout file name
     */
    layout: 'template.ejs'
  },
  build: {
    srcPath: '../frontend',
    outputPath: process.env.NODE_ENV === 'production' ? './docs' : './build/public_html'
  },
  selfserve: {
    hostPort: 8001,
    backupPort: 8001,

    /**MongoDB Credentials */
    username: 'admin',
    password: 'password',

    /**URL mongo is hosted on */
    url: '127.0.0.1',

    /**Default DB when one isn't specified */
    default_db: 'testdb',
    port: 27017,

    /**If you want to hook in and handle auth yourself. */
    skip_auth: true,

    full_chain_path: './vsatresq.com/fullchain1.pem',
    priv_key_path: './vsatresq.com/privkey1.pem',
    ca_path: './vsatresq.com/fullchain1.pem',
    cert_path: './vsatresq.com/cert1.pem',
    calendar: {
      google_client_id: '890936756080-jotv0tadvgavbir7dof154dga1n3sts8.apps.googleusercontent.com',
      google_client_secret: 'QyykaHqdqPCJK_dv5WML8UCb'
    }
  }
};
