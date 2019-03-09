class ItemsController < ApplicationController

  require 'csv'
  require 'peddler'
  before_action :authenticate_user!, only: :get

  rescue_from CanCan::AccessDenied do |exception|
    redirect_to root_url, :alert => exception.message
  end

  def get

    res = params[:data]
    logger.debug("Parameter=\n\n")
    logger.debug(res)
    @user = current_user.email

    current_email = current_user.email
    csv_data = CSV.read('app/others/csv/Flat.File.Toys.jp.csv', headers: true)
    gon.csv_head = csv_data

    if request.get? then

    else
      if res != nil then
        logger.debug(current_user.email)
        logger.debug("\n<=debug\n")
        parser = JSON.parse(res)
        result = parser[0]
        counter = parser[1]

        logger.debug(counter)
        logger.debug("\n<=debug\n")
        logger.debug(result)

        res = result

        i = counter
        maxnum = 10
        process = 0
        while i < result.length

            url = result[i][0]
            if url != "" && url != nil  then
              charset = nil
              html = open(url) do |f|
                charset = f.charset # 文字種別を取得
                f.read # htmlを読み込んで変数htmlに渡す
              end
              doc = Nokogiri::HTML.parse(html, nil, charset)
              if doc.xpath('//p[@class="ptsFin"]')[0] == nil then

                #商品が出品中の場合
                title = doc.xpath('//h1[@class="ProductTitle__text"]').text.gsub("\n","")
                productinfo = doc.xpath('//li[@class="ProductDetail__item"]')

                k = 0
                while k < productinfo.length
                  str = productinfo[k].text
                  if str.include?("状態") == true then
                    condition = productinfo[k].inner_html.match(/pan>([\s\S]*?)</)[1]
                  end
                  if str.include?("オークションID") == true then
                    auctionID = productinfo[k].inner_html.match(/pan>([\s\S]*?)<\/dd/)[1]
                  end
                  k += 1
                end
                k = 0


                priceType = doc.xpath('//div[@class="Price Price--current"]//dd[@class="Price__value"]')
                if priceType[0] != nil then
                  listPrice = priceType[0].text.gsub("\n","")

                  if listPrice.include?("（税 0 円）") == true then
                    listPrice = listPrice.gsub(/（税 0 円）/,"")
                    listPrice = CCur(listPrice)
                  else
                    listPrice = listPrice.match(/税込([\s\S]*?)円/)[1]
                    listPrice = CCur(listPrice)
                  end
                else
                  listPrice = 0
                end

                priceType = doc.xpath('//div[@class="Price Price--buynow"]//dd[@class="Price__value"]')
                if priceType[0] != nil then
                  binPrice = priceType[0].text.gsub("\n","")
                  if binPrice.include?("（税 0 円）") == true then
                    binPrice = binPrice.gsub(/（税 0 円）/,"")
                    binPrice = CCur(binPrice)
                  else
                    binPrice = binPrice.match(/税込([\s\S]*?)円/)[0]
                    binPrice = binPrice.gsub(/税込/,"")
                    binPrice = CCur(binPrice)
                  end
                else
                  binPrice = 0
                end

                bitnum = doc.xpath('//dd[@class="Count__number"]')[0].text
                bitnum = bitnum.slice(0,bitnum.length-4)

                restTime = doc.xpath('//dd[@class="Count__number"]')[1].text
                restTime = restTime.slice(0,restTime.length-4)

                images = doc.xpath('//div[@class="ProductImage__inner"]')
                image = []

                k = 0

                while k < images.length
                  str = images[k].inner_html
                  image[k] = str.match(/src="([\s\S]*?)"/)[1]
                  k += 1
                end

              else
                #オークションが終了している場合

                title = doc.xpath('//h1[@property="auction:Title"]')[0].text
                title = "[終了したオークション]" + title

                auctionID = doc.xpath('//td[@property="auction:AuctionID"]')[0]
                if auctionID != nil then
                  auctionID = auctionID.text
                end
                condition = doc.xpath('//td[@property="auction:ItemStatus"]')[0]
                if condition != nil then
                  condition = condition.text
                end

                binPrice = ""
                checkTax = doc.xpath('//p[@class="decTxtTaxIncPrice"]')[0]
                if checkTax != nil then
                  checkTax = checkTax.text
                end

                logger.debug(url)

                listPrice = doc.xpath('//p[@class="decTxtBuyPrice Price__value"]')[0]
                if listPrice != nil then
                  listPrice = doc.xpath('//p[@class="decTxtBuyPrice Price__value"]')[0].text
                else
                  listPrice = doc.xpath('//p[@class="decTxtAucPrice Price__value"]')[0].text
                end
                listPrice = CCur(listPrice)
                if listPrice != nil then
                  if listPrice.include?("%") then
                    listPrice = /^([\s\S]*?)\s/.match(listPrice)[1]
                  end
                end
                binPrice = 0
                bitnum = doc.xpath('//b[@property="auction:Bids"]')[0]
                if bitnum != nil then
                  bitnum = bitnum.text
                end

                restTime = "終了"
                k = 0
                image = []
                while k < 3
                  images = doc.xpath('//img[@id="imgsrc' + (k+1).to_s + '"]')
                  if images[0] != nil then
                    image[k] = images[0].attribute("src").value
                  end
                  k += 1
                end
              end
            else
              title = ""
              auctionID = ""
              listPrice = ""
              binPrice = ""
              condition = ""
              bitnum = ""
              restTime = ""
              k = 0
              image = []
              while k < 3
                image[k] = ""
                k += 1
              end
            end
            title = title.gsub("\t", "")

            res[i] = [url,title,auctionID,listPrice,binPrice,condition,bitnum,restTime,image[0],image[1],image[2]]

            process += 1
            if process > maxnum - 1 then
              break
            end
            i += 1
        end

        logger.debug("\ndebug=>\n")
        @result = res
        render json: res
      end
    end
  end

  def upload
    logger.debug("\n\n\n")
    logger.debug("Debug Start!")
    current_email = current_user.email
    user = Account.find_by(email: current_email)
    aws = user.AWSkey
    skey = user.skey
    seller = user.sellerId

    res = params[:data]

    #client = MWS.sellers(
    #  primary_marketplace_id: "A1VC38T7YXB528",
    #  merchant_id: seller,
    #  aws_access_key_id: aws,
    #  aws_secret_access_key: skey
    #)
    client = MWS.feeds(
      primary_marketplace_id: "A1VC38T7YXB528",
      merchant_id: seller,
      aws_access_key_id: aws,
      aws_secret_access_key: skey
    )

    res1 = JSON.parse(res)
    #res1 = [["a","b","c"],[1,2,3],["村上","りえ","ネコ"]]

    logger.debug("Pre Feed Content is \n\n")
    logger.debug(res1)

    kk = 0
    feed_body = ""
    while kk < res1.length
      feed_body = feed_body + res1[kk].join("\t")
      feed_body = feed_body + "\n"
      kk += 1
    end

    new_body = feed_body.encode(Encoding::Windows_31J)

    #return

    logger.debug("Feed Content is \n\n")
    logger.debug(new_body)

    feed_type = "_POST_FLAT_FILE_LISTINGS_DATA_"
    parser = client.submit_feed(new_body, feed_type)
    doc = Nokogiri::XML(parser.body)

    submissionId = doc.xpath(".//mws:FeedSubmissionId", {"mws"=>"http://mws.amazonaws.com/doc/2009-01-01/"}).text

    process = ""
    err = 0
    while process != "_DONE_" do
      sleep(25)
      list = {feed_submission_id_list: submissionId}
      parser = client.get_feed_submission_list(list)
      doc = Nokogiri::XML(parser.body)
      process = doc.xpath(".//mws:FeedProcessingStatus", {"mws"=>"http://mws.amazonaws.com/doc/2009-01-01/"}).text
      logger.debug(doc)
      err += 1
      if err > 1 then
        break
      end
    end


    parser = client.get_feed_submission_result(submissionId)
    doc = Nokogiri::XML(parser.body)
    logger.debug(doc)
    logger.debug("\n\n")
    #submissionId = doc.match(/FeedSubmissionId>([\s\S]*?)<\/Feed/)[1]
    #parser.parse # will return a Hash object

    res = ["test"]
    render json: res
  end

  def set

    if request.post? then
      res = params[:data]
      res = JSON.parse(res)
      ptable = res['price']
      ttable = res['title']
      ftable = res['fixed']
      keytable = res['keyword']

      current_email = current_user.email

      temp = Setting.find_by(email:current_email)
      logger.debug("Account is search!!\n\n")
      logger.debug(Setting.select("price"))
      if temp != nil then
        logger.debug("Account is found!!!")
        user = Setting.find_by(email:current_email)
        user.update(fixed: ftable, keyword: keytable, title: ttable, price: ptable )
        user.save
      else
        user = Setting.create(
          email: current_user.email,
          fixed: ftable,
          keyword: keytable,
          price: ptable,
          title: ttable,
        )

      end
    else
      logger.debug("Access is GET")
      current_email = current_user.email
      temp = Setting.find_by(email:current_email)
      if temp != nil then
        logger.debug("Account is found")
        user = Setting.find_by(email:current_email)
        pt = user.price
        kt = user.keyword
        tt = user.title
        ft = user.fixed
        if pt.length < 500 then
          for num in pt.length..500 do
            pt[num] = [num * 500,2980+num * 500]
            kt[num] = ["","","","",""]
            tt[num] = ["",""]
            ft[num] = ["","",""]
          end
        end
        data = {price: pt, title: tt, keyword: kt, fixed: ft}
        logger.debug(data)
        gon.udata = data
      else
        pt = []
        kt = []
        tt = []
        ft = []

        for num in 0..500 do
          pt[num] = [num * 500,2980+num * 500]
          kt[num] = ["","","","",""]
          tt[num] = ["",""]
          ft[num] = ["","",""]
        end

        rnum = 100;

        ft[0][0] = "feed_product_type"
        ft[1][0] = "quantity"
        ft[2][0] = "recommended_browse_nodes"
        ft[3][0] = "fulfillment_latency"
        ft[4][0] = "condition_type"
        ft[5][0] = "condition_note"
        ft[6][0] = "standard_price_points"
        ft[0][1] = "商品タイプ"
        ft[1][1] = "数量"
        ft[2][1] = "推奨ブラウズノード番号"
        ft[3][1] = "出荷作業日数"
        ft[4][1] = "商品のコンディション"
        ft[5][1] = "商品のコンディション説明"
        ft[6][1] = "ポイント（販売価格に対するパーセントを記入）"

        data = {price: pt, title: tt, keyword: kt, fixed: ft}
        gon.udata = data
      end
    end
    logger.debug(user)

  end

  def set_csv

    current_email = current_user.email

    temp = Setting.find_by(email:current_email)
    if temp != nil then
      logger.debug("Account is found!!!")
      user = Setting.find_by(email:current_email)
      ttable = user.title
      ptable = user.price
      ftable = user.fixed
      ktable = user.keyword
      data = {title: ttable, price: ptable, fixed: ftable, keyword: ktable}
      logger.debug("OK start")
      logger.debug(data)
      render json: data
    else
      data = {fixed: ["none"]}
      render json: data
    end

  end

  def output
    res = params[:data]
    res = JSON.parse(res)
    send_data(res, filename: "test.csv", type: :csv)
  end


  def login_check
    @user = current_user
  end

  private def CCur(value)
    res = value.gsub(/\,/,"")
    res = res.gsub(/円/,"")
    return res
  end

end
