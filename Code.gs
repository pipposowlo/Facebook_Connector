Function getConfig(request) {
  var service = getService();
  
  // Constructing the URL for Ad Account Insights API request
  var url = 'https://graph.facebook.com/v19.0/me/adaccounts?fields=name,id';
  
  // Fetching ad account data from Facebook API
  var response = UrlFetchApp.fetch(url, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + service.getAccessToken()
    }
  });
  
  // Parsing the response to extract relevant data
  var adAccountData = JSON.parse(response.getContentText());
  
  // Creating the config object with options for Ad Account ID
  var config = {
    configParams: [
      {
        type: "SELECT_SINGLE",
        name: "adAccountID",
        displayName: "Ad Account ID",
        helpText: "Please select the Ad Account ID for which you would like to retrieve the Statistics.",
        options: []
      }
    ],
    dateRangeRequired: true
  };
  
  // Populating the options for Ad Account ID based on the ad account data
  adAccountData.data.forEach(function(account) {
    config.configParams[0].options.push({
      label: account.name,
      value: account.id
    });
  });
  
  // Return the config object
  return config;
}


var facebookSchema = [
  {
    name: 'date_start',
    label: 'Date start',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  {
    name: 'date_end',
    label: 'Date end',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  {
    name: 'campaign_name',
    label: 'Campaign Name',
    dataType: 'STRING',
    semantics: {
      conceptType: 'DIMENSION'
    }
  },
  {
    name: 'clicks',
    label: 'Clicks',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  },
  {
    name: 'cpm',
    label: 'CPM',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  },
  
  {
    name: 'impressions_daily',
    label: 'Impressions',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  },
  {
    name: 'purchases',
    label: 'Purchase',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  },{
    name: 'spend',
    label: 'Spend',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  }
  
];


function getSchema(request) {
  return {schema: facebookSchema};
};



function getData(request) {

  var service = getService();
  
  function dateDelta(dObj, num) {
    if (isNaN(num)) {
      var dateStart = new Date(dObj);
    } else {
      var dateStart = new Date(dObj);
      var dateStart = new Date(dateStart.setDate(dateStart.getDate() + num));
    }
    var dd = dateStart.getDate();
    var mm = dateStart.getMonth()+1; //January is 0!
    
    var yyyy = dateStart.getFullYear();
    if(dd<10){
        dd='0'+dd;
    } 
    if(mm<10){
        mm='0'+mm;
    } 
    var dateStart = yyyy + "-" + mm + "-" + dd;
    return dateStart;
  }
  
  var gStartDate = new Date(request.dateRange.startDate);
  var gEndDate = new Date(request.dateRange.endDate);
  var gRange = Math.ceil(Math.abs(gEndDate - gStartDate) / (1000 * 3600 * 24));
  var gBatches = Math.ceil(gRange / 92);

  if (gBatches < 2) {
    var batch = [{"method": "GET", "relative_url": request.configParams.adAccountID + "/insights/?level=adset&fields=impressions,cpm,clicks,spend,campaign_id,campaign_name,adset_name,action_values&filtering=[{\"field\":\"action_type\",\"operator\":\"IN\",\"value\":[\"purchase\"]}]&limit=5000&time_range={'since':'" + dateDelta(gStartDate) + "','until':'" + dateDelta(gEndDate) + "'}&time_increment=monthly"}];
    //console.log(batch);
  } else {
    batch = [];
    var iterRanges = gRange / gBatches;
    
    for (i = 0; i < gBatches; i++) {
      var iterStart = dateDelta(gStartDate, (iterRanges * i));
      if (i == (gBatches - 1)) {
        var iterEnd = dateDelta(gEndDate);
      } else {
        var iterEnd = dateDelta(gStartDate, (iterRanges * (i + 1)) + 1);
      }
      batch.push({"method": "GET", "relative_url": request.configParams.adAccountID + "/insights/?level=adset&fields=impressions,cpm,clicks,spend,campaign_id,campaign_name,adset_name,actions_values&filtering=[{\"field\":\"action_type\",\"operator\":\"IN\",\"value\":[\"purchase\"]}]&limit=5000&time_range={'since':'" + iterStart + "','until':'" + iterEnd + "'}&time_increment=monthly"})
    }
    //console.log(batch);
  }
    // Fetch the data with UrlFetchApp
  var url = "https://graph.facebook.com/v19.0/?include_headers=false&batch=" + encodeURIComponent(JSON.stringify(batch))
  
  var response = (UrlFetchApp.fetch(url, {
    method: 'POST',
    headers: {    
        Authorization: 'Bearer ' + service.getAccessToken()
    }
  }));

var adAccountData = JSON.parse(response.getContentText());
  // Prepare the schema for the fields requested.
  var dataSchema = [];

  console.info("adAccountData: ", JSON.stringify(adAccountData));
  
  request.fields.forEach(function(field) {
    for (var i = 0; i < facebookSchema.length; i++) {
      if (facebookSchema[i].name === field.name) {
        dataSchema.push(facebookSchema[i]);
        break;
      }
    }
  });
  var data = [];
      
  // Prepare the tabular data
adAccountData.forEach(function(resp) {
    var jsonData = JSON.parse(resp.body);
    jsonData.data.forEach(function(entry) {
        var values = [];
        dataSchema.forEach(function(field) {
            switch(field.name) {
                case 'date_start':
                    values.push(entry.date_start);
                    break;
                case 'date_end':
                    values.push(entry.date_stop);
                    break;
                case 'campaign_id':
                    values.push(entry.campaign_id);
                    break;
                case 'campaign_name':
                    values.push(entry.campaign_name);
                    break;
                case 'clicks':
                    values.push(parseInt(entry.clicks));
                    break;
                case 'cpm':
                    values.push(parseFloat(entry.cpm));
                    break;
                case 'impressions_daily':
                    values.push(parseInt(entry.impressions));
                    break;
                case 'spend':
                values.push(parseFloat(entry.spend));
                break;
                case 'purchases':
                    // Check if the 'actions' array exists and has elements
                    if (entry.action_values && entry.action_values.length > 0) {
                        // Iterate through the 'actions' array to find 'purchase' action_type
                        var purchaseValue = entry.action_values.find(function(action) {
                            return action.action_type === 'purchase';
                        });
                        // Push the purchase value if found, otherwise push an empty string
                        values.push(purchaseValue ? parseFloat(purchaseValue.value) : '');
                    } else {
                        // If 'actions' array doesn't exist or is empty, push an empty string
                        values.push('');
                    }
                    break;
                default:
                    values.push('');
            }
        });
        // Push the values for this entry into the data array
        data.push({
            values: values   
        });
    });
});
  // Return the tabular data for the given request.
  return {
    schema: dataSchema,
    rows: data
  };
};

function isAdminUser() {
  if (Session.getEffectiveUser().getEmail() == "#########@gmail.com") {
    return true;
  }
}

function getAuthType() {
  // Returns the authentication method required.
  var response = {
    "type": "OAUTH2"
  };
  return response;
}
