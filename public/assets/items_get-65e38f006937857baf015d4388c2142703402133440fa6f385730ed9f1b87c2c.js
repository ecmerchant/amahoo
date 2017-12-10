
var maxColnum = 11;
var maxRownum = 300;
var mydata = [];
var colOption = [];

for(var i = 0; i < maxRownum; i++){
  mydata[i] = [];
  for(var j = 0; j < maxColnum; j++){
    mydata[i][j] = "";
  }
  //colOption[i] = {readOnly: false};
}
//colOption[0] = {readOnly: false};


var container = document.getElementById('main');
var handsontable = new Handsontable(container, {
  /* オプション */
  width: 980,
  height: 240,
  contextMenu: true,
  data: mydata,
  rowHeaders: true,
  colHeaders: ["ヤフオク商品URL","商品タイトル","オークションID","現在価格","即決価格","状態","入札件数","残り時間","画像1","画像2","画像3"],
  maxCols: maxColnum,
  maxRows: maxRownum,
  manualColumnResize: true,
  autoColumnSize: false,
  colWidths:[200,300,150,120,120,120,120,120,120,120,120]
  //columns: colOption
});

var csv_container = document.getElementById('csv');
var idata = gon.csv_head
var ini = idata

var csv_handsontable = new Handsontable(csv_container, {
  /* オプション */
  width: 980,
  height: 240,
  //data: mydata,
  data: idata,
  contextMenu: true,
  rowHeaders: true,
  colHeaders: true,
  maxRows: maxRownum,
  manualColumnResize: true,
  autoColumnSize: false,
  wordWrap: false
});
csv_handsontable.alter('insert_row', idata.length,10);

var selected_container = document.getElementById('selected');
var init = [];
init[0] = [];
init[0][0] = "";

var selected_handsontable = new Handsontable(selected_container, {
  /* オプション */
  width: 380,
  height: 60,
  colWidths: [340],
  //data: mydata,
  data: init,
  colHeaders: ["選択中のセル"],
  rowHeaders: false,
  maxRows: 1,
  manualColumnResize: true,
  autoColumnSize: true,
  wordWrap: false
});

Handsontable.hooks.add('afterSelectionEnd', function() {
  var data = csv_handsontable.getValue();
  var res = [];
  res[0] = [];
  res[0][0] = data;
  //res[0][0] = 2;
  //alert(res);
  selected_handsontable.loadData(res);
  selected_handsontable.render();
  //alert("ok");
}, csv_handsontable);


$("#done").click(function () {
  var orgData = handsontable.getData();
  var urlnum = 0;
  var pbar = document.getElementById('progressbar');
  pbar.style.width = "0%";
  while(orgData[urlnum][0] != ""){
    urlnum++;
  }
  var counter = 0;
  alert("データ取得開始");
  repajax(counter,urlnum);

});

function repajax(counter,urlnum){

  var orgData = handsontable.getData();
  var tempData = JSON.stringify(orgData);
  tempData = {data: tempData};
  var pbar = document.getElementById('progressbar');
  var sendData = [orgData, counter];
  sendData = JSON.stringify(sendData);
  sendData = {data: sendData};
  $.ajax({
    url: "/items/get",
    async: true,
    type: "POST",
    //data: tempData,
    data: sendData,
    dataType: 'json',
    success: function (myData) {
      handsontable.loadData(myData);
      orgData = handsontable.getData();
      counter = counter + 10;
      if(counter > urlnum){
        counter = urlnum;
        var parcent = Math.round(counter / urlnum * 100);
        pbar.style.width = parcent + "%";
        var result = true;
        alert("取得完了!");
        return;
      }else{
        var parcent = Math.round(counter / urlnum * 100);
        pbar.style.width = parcent + "%";
        var result = true;
        repajax(counter,urlnum);
      }
    },
    error: function (myData) {
      var result = false;
      alert("NG");
    }
  });
}

$("#make_csv").click(function () {

  var itemData = handsontable.getData();
  var myData = [];

  $.ajax({
    url: "/items/set_csv",
    type: "GET",
    success: function (myData) {
      var header = csv_handsontable.getData();
      var headernum = 3;
      var ttime = new Date();

      var mm = (ttime.getMonth()+1).toString(10);
      var dd = ttime.getDate().toString(10);
      var hh = ttime.getHours().toString(10);
      var mi = ttime.getMinutes().toString(10);

      mm = ("0" + mm).slice(-2);
      dd = ("0" + dd).slice(-2);
      hh = ("0" + hh).slice(-2);
      mi = ("0" + mi).slice(-2);

      var chead =  mm + dd + hh + mi;

      for(var k = 0; k < itemData.length; k++){
        if(itemData[k][0] == ""){
          var itemnum = k;
          break;
        }
      }

      var ftable = myData['fixed'];

      if(ftable == "none"){
        alert("はじめにパラメータを設定して下さい");
        return;
      }

      var ptable = myData['price'];
      var ttable = myData['title'];
      var ftable = myData['fixed'];
      var ktable = myData['keyword'];

      var headerhash = {};

      var newdata = [];
      for(var i = 0; i < headernum; i++){
        newdata[i] = header[i];
        if(i == 2){
          for(var k = 0; k < header[i].length; k++){
            headerhash[header[i][k]] = k;
          }
        }
      }

      var khash = {};
      var fhash = {};

      for(var k = 0; k < ftable.length; k++){
        fhash[ftable[k][0]] = ftable[k][2];
      }


      for(var k = 0; k < ktable.length; k++){
        var temp = [];
        temp[0] = ktable[k][1];
        temp[1] = ktable[k][2];
        temp[2] = ktable[k][3];
        temp[3] = ktable[k][4];
        khash[ktable[k][0]] = temp;
      }

      if(itemnum != 0){
        for(var i = 0; i < itemnum; i++){
          newdata[i+headernum] = [];
          for(var j = 0; j < header[2].length; j++){
            newdata[i+headernum][j] = "";
          }

          var judge = false;
          var n = 0;
          var ch = [];

          for(key in khash){
            var indv = key.split(" ")
            var ch = [];
            for(var y = 0; y < indv.length; y++){
              if(indv[y] == ""){
                break;
              }else{
                ch[y] = itemData[i][1].toUpperCase().indexOf(indv[y].toUpperCase());
              }
            }
            if(Math.max.apply(null,ch) > -1){
              var gh = khash[key];
              judge = true;
              break;
            }
          }
          //alert(judge);
          var price = Number(itemData[i][4]);

          if(price == 0){
            price = Number(itemData[i][3]);
          }

          for(var m = 0; m < ptable.length; m++){
            if(Number(ptable[m][0]) > price){
              price = Number(ptable[m-1][1]) + (Number(ptable[m][1]) - Number(ptable[m-1][1]))/(Number(ptable[m][0]) - Number(ptable[m-1][0])) * (price - Number(ptable[m-1][0]));
              price = Math.round(price,0);
              break;
            }
          }
          var newname = itemData[i][1];

          for(var m = 0; m < ttable.length; m++){
            if(ttable[m][0] != ""){
              while (newname.indexOf(ttable[m][0]) >= 0) {
                newname = newname.replace(ttable[m][0],ttable[m][1]);
                newname = newname.trim();
              }
            }
          }

          newdata[i+headernum][headerhash['item_sku']] = itemData[i][2];
          newdata[i+headernum][headerhash['item_name']] = newname;
          newdata[i+headernum][headerhash['standard_price']] = price;
          newdata[i+headernum][headerhash['main_image_url']] = itemData[i][8];
          newdata[i+headernum][headerhash['other_image_url1']] = itemData[i][9];
          newdata[i+headernum][headerhash['other_image_url2']] = itemData[i][10];



          //newdata[i+headernum][headerhash['external_product_id']] = chead + tnum;
          //newdata[i+headernum][headerhash['external_product_id_type']] = "EAN";

          for(var t = 0; t < ftable.length; t++){
            if(ftable[t][0] in headerhash){
              newdata[i+headernum][headerhash[ftable[t][0]]] = ftable[t][2];
            }
          }

          if(judge == true){
            newdata[i+headernum][headerhash['brand_name']] = gh[0];
            newdata[i+headernum][headerhash['manufacturer']] = gh[1];
            newdata[i+headernum][headerhash['recommended_browse_nodes']] = gh[2];
            newdata[i+headernum][headerhash['generic_keywords']] = gh[3];
          }
          var tnum = ("0000" + i).slice(-4);
          var a = Math.floor( Math.random() * (100 + 1 - 1) ) + 1 ;
          var rnum = ("0000" + a).slice(-4);

          newdata[i+headernum][headerhash['part_number']] = rnum + tnum;
          newdata[i+headernum][headerhash['model']] = rnum + tnum;

          newdata[i+headernum][headerhash['product_description']] = newname + "です。";
          newdata[i+headernum][headerhash['bullet_point1']] = newname + "です。";
          newdata[i+headernum][headerhash['update_delete']] = "Update";
          newdata[i+headernum][headerhash['standard_price_points']] = Math.round(fhash['standard_price_points']*price/100,0);
        }
      }
      csv_handsontable.loadData(newdata);
      alert("CSV作成");
    },
    error: function (myData) {
      alert("NG");
    }
  });

});

$("#csv_output").click(function () {
  var tempData = csv_handsontable.getData();
  var csvdata = "";

  for(var k = 0; k < tempData.length; k++){
    csvdata = csvdata + tempData[k].join("\t") + "\n";
  }

  var str_array = Encoding.stringToCode(csvdata);
  var sjis_array = Encoding.convert(str_array, "SJIS", "UNICODE");
  var uint8_array = new Uint8Array(sjis_array);

  var blob = new Blob([uint8_array], { "type" : "text/tsv" });
  //var blob = new Blob(["あいうえお"], { "type" : "text/tsv" });

  if (window.navigator.msSaveBlob) {
      window.navigator.msSaveBlob(blob, "list.txt");

      // msSaveOrOpenBlobの場合はファイルを保存せずに開ける
      window.navigator.msSaveOrOpenBlob(blob, "list.txt");
  } else {
      document.getElementById("csv_output").href = window.URL.createObjectURL(blob);
  }
});

$("#csv_upload").click(function () {
  var tempData = csv_handsontable.getData();
  tempData = JSON.stringify(tempData);
  myData = {data: tempData};
  $.ajax({
    url: "/items/upload",
    type: "POST",
    data: myData,
    dataType: 'json',
    success: function (myData) {
      alert("アップロード受け付けました");
    },
    error: function (myData) {
      //alert("NG");
    }
  });
});


// 文字列を配列に変換
var str2array = function(str) {
    var array = [],i,il=str.length;
    for(i=0;i<il;i++) array.push(str.charCodeAt(i));
    return array;
};
