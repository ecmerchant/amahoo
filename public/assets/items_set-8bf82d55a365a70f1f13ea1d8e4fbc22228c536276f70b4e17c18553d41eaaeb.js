for(var maxColnum=2,maxRownum=10,price_data=[],title_data=[],colOption=[],idata=gon.udata,pdata=idata.price,fdata=idata.fixed,tdata=idata.title,kdata=idata.keyword,i=0;i<maxRownum;i++){price_data[i]=[],title_data[i]=[];for(var j=0;j<maxColnum;j++)price_data[i][j]=2e3*i,title_data[i][j]="";colOption[i]={readOnly:!0}}colOption[0]={readOnly:!1};for(var price_container=document.getElementById("price_table"),price_handsontable=Handsontable(price_container,{width:480,height:240,data:pdata,rowHeaders:!0,colHeaders:["\u30e4\u30d5\u30aa\u30af\u8ca9\u58f2\u4fa1\u683c","\u30a2\u30de\u30be\u30f3\u8ca9\u58f2\u4fa1\u683c"],maxCols:maxColnum,maxRows:maxRownum,manualColumnResize:!0,autoColumnSize:!1,colWidths:[200,200]}),title_container=document.getElementById("title_table"),title_handsontable=Handsontable(title_container,{width:480,height:240,data:tdata,rowHeaders:!0,colHeaders:["\u7f6e\u63db\u524d","\u7f6e\u63db\u5f8c"],maxCols:maxColnum,maxRows:maxRownum,manualColumnResize:!0,autoColumnSize:!1,colWidths:[200,200]}),int_data=[],rnum=9,i=0;i<rnum;i++)int_data[i]=[],int_data[i][0]="",int_data[i][1]="";int_data[0][0]="feed_product_type",int_data[1][0]="quantity",int_data[2][0]="recommended_browse_nodes",int_data[3][0]="fulfillment_latency",int_data[4][0]="condition_type",int_data[5][0]="condition_note",int_data[6][0]="merchant_shipping_group_name";for(var fix_container=document.getElementById("fix_table"),fix_handsontable=Handsontable(fix_container,{width:800,height:240,data:fdata,rowHeaders:!0,colHeaders:["\u9805\u76ee\u540d","\u5024"],maxCols:maxColnum,maxRows:maxRownum,manualColumnResize:!0,autoColumnSize:!0,colWidths:[200,200]}),brand_data=[],i=0;i<20;i++)brand_data[i]=[],brand_data[i][0]="",brand_data[i][1]="",brand_data[i][2]="",brand_data[i][3]="",brand_data[i][4]="";var brand_container=document.getElementById("brand_table"),brand_handsontable=Handsontable(brand_container,{width:1e3,height:240,data:kdata,rowHeaders:!0,colHeaders:["\u30ad\u30fc\u30ef\u30fc\u30c9","brand_name","manufacturer","recommended_browse_nodes","generic_keywords"],maxCols:5,maxRows:maxRownum,manualColumnResize:!0,autoColumnSize:!1,colWidths:[200,150,150,250,400]});$("#save").click(function(){var a=price_handsontable.getData(),t=title_handsontable.getData(),e=brand_handsontable.getData(),n=fix_handsontable.getData(),i={price:a,title:t,keyword:e,fixed:n};i=JSON.stringify(i),myData={data:i},$.ajax({url:"/items/set",type:"POST",data:myData,dataType:"json",success:function(){alert("OK")},error:function(){alert("NG")}})});