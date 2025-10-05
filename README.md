# Facebook_Connector
**Google Data Studio Community Connector for Facebook Insights.**

Based  on @halsandr Facebook connector.
Works with OAut2. Make sure to grant marketing Api access to your Facebook app as you will need  ads_read and read_insights permissions.

Implemented Api pagination in the latest release.
Updated to work with Insight API 21.0

ATTENTION: The script is set so to get purchase values from the 7d_click attribution, ignoring sales coming from 1d_view. 
If you wish to get standard 7d_click, 1d_view check the comments in code.gs and change accordingly. 

------------
[![Facebook Connector](https://img.shields.io/github/tag/halsandr/Facebook_Connector.svg)](https://github.com/halsandr/Facebook_Connector)

Follow the setup from [here](https://github.com/googlesamples/apps-script-oauth2) to get the OAuth2 working, dont forget to fill in the `CLIENT_ID` and `CLIENT_SECRET` at the top of `Facebook_OAuth2.gs`.

There is also the option to put your email address in `Code.gs` in the function `isAdminUser()`, this will give you slightly more verbose errors should you encounter them.

[Google's Community Connector Guide](https://developers.google.com/datastudio/connector/get-started) is a very usefull resource when setting up your community connector, Developer access will also need to be [requested](https://goo.gl/forms/MfxSU71PqP3P0RoM2) before you can use your Community Connector.
