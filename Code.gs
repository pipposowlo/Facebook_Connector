function getConfig(request) {
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
    name: 'ctr',
    label: 'CTR',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  },
  {
    name: 'cpc',
    label: 'CPC',
    dataType: 'NUMBER',
    semantics: {
      conceptType: 'METRIC'
    }
  },
  {
    name: 'frequency',
    label: 'FREQUENCY',
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

  // Helper function to adjust dates
  function dateDelta(dObj, num) {
    var dateStart = new Date(dObj);
    if (!isNaN(num)) {
      dateStart.setDate(dateStart.getDate() + num);
    }
    var dd = dateStart.getDate();
    var mm = dateStart.getMonth() + 1; // January is 0
    var yyyy = dateStart.getFullYear();
    return yyyy + "-" + (mm < 10 ? '0' + mm : mm) + "-" + (dd < 10 ? '0' + dd : dd);
  }

  // Encode parameters
  var actionAttributionWindows = encodeURIComponent(JSON.stringify(['7d_click'])); //change attribution parameter here. If you prefer standard meta attribution use ['7d_click','1d_view'] 
  var fields = encodeURIComponent('impressions,ctr,cpc,frequency,cpm,clicks,spend,campaign_id,campaign_name,adset_name,action_values');
  var filtering = encodeURIComponent(JSON.stringify([{ field: "action_type", operator: "IN", value: ["purchase"] }]));
  var timeRange = encodeURIComponent(JSON.stringify({
    since: dateDelta(request.dateRange.startDate),
    until: dateDelta(request.dateRange.endDate)
  }));

  var baseUrl = `https://graph.facebook.com/v21.0/${request.configParams.adAccountID}/insights/`;
  var url = `${baseUrl}?action_attribution_windows=${actionAttributionWindows}&level=adset&fields=${fields}&filtering=${filtering}&time_range=${timeRange}&limit=5000`;

  var dataSchema = [];
  var data = [];

  // Populate the schema based on requested fields
  request.fields.forEach(function(field) {
    facebookSchema.forEach(function(schemaField) {
      if (schemaField.name === field.name) {
        dataSchema.push(schemaField);
      }
    });
  });

  // Loop to handle pagination
  while (url) {
    console.info("Fetching data from URL: ", url); // Log current request URL
    var response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer ' + service.getAccessToken()
      }
    });

    var jsonResponse = JSON.parse(response.getContentText());
    console.info("API Response: ", JSON.stringify(jsonResponse)); // Log API response

    // Process data from the current page
    jsonResponse.data.forEach(function(entry) {
      var values = [];
      dataSchema.forEach(function(field) {
        switch (field.name) {
          case 'date_start':
            values.push(entry.date_start);
            break;
          case 'date_end':
            values.push(entry.date_stop);
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
          case 'ctr':
            values.push(parseFloat(entry.ctr));
            break;
          case 'cpc':
            values.push(parseFloat(entry.cpc));
            break;
          case 'frequency':
            values.push(parseFloat(entry.frequency));
            break;
          case 'impressions_daily':
            values.push(parseInt(entry.impressions));
            break;
          case 'spend':
            values.push(parseFloat(entry.spend));
            break;
         case 'purchases':
    var purchaseValue = entry.action_values?.find(a => a.action_type === 'purchase')?.['7d_click'] || ''; //  change to (a => a.action_type === 'purchase')?.value || ''; for standard 7d_click, 1d_view attribution
    values.push(parseFloat(purchaseValue) || '');
    break;
          default:
            values.push('');
        }
      });
      data.push({ values: values });
    });

    // Log current batch data
    console.info("Processed Data Batch: ", JSON.stringify(data));

    // Check for next page
    url = jsonResponse.paging?.next || null;
    console.info("Next Page URL: ", url); // Log next page URL
  }

  // Return the aggregated data
  console.info("Final Data Schema: ", JSON.stringify(dataSchema));
  console.info("Final Data Rows: ", JSON.stringify(data));
  return {
    schema: dataSchema,
    rows: data
  };
}

function isAdminUser() {
  if (Session.getEffectiveUser().getEmail() == "xxxxx@xxxxxxx.xxx") {
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
