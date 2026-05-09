//+------------------------------------------------------------------+
//|                                                   STOIX_Sync.mq4 |
//|                                         STOIX Trade with Discipline|
//|                                          https://stoixtrader.com  |
//+------------------------------------------------------------------+
#property copyright "STOIX"
#property link      "https://stoixtrader.com"
#property version   "1.00"
#property strict

// User inputs
input string STOIX_API_KEY = "PASTE_YOUR_STOIX_KEY_HERE"; // Your STOIX Connection Key
input int    SYNC_INTERVAL = 30;                           // Sync interval in seconds
input bool   SYNC_HISTORY  = true;                         // Sync full trade history on start

// Endpoint
string ENDPOINT = "https://pwgsrikdthttjbnboiua.supabase.co/functions/v1/sync-trades";

// Internal state
datetime lastSync = 0;
int      lastOrderCount = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                    |
//+------------------------------------------------------------------+
int OnInit() {
   Print("STOIX Sync EA initialized. Key: ", StringSubstr(STOIX_API_KEY, 0, 8), "...");
   
   if (STOIX_API_KEY == "PASTE_YOUR_STOIX_KEY_HERE" || StringLen(STOIX_API_KEY) < 10) {
      Alert("STOIX: Please enter your Connection Key in the EA settings.");
      return INIT_FAILED;
   }
   
   // Initial sync on load
   SyncTrades(SYNC_HISTORY);
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert tick function                                              |
//+------------------------------------------------------------------+
void OnTick() {
   // Sync on interval
   if (TimeCurrent() - lastSync >= SYNC_INTERVAL) {
      SyncTrades(false);
      lastSync = TimeCurrent();
   }
   
   // Also sync immediately when order count changes (new trade opened/closed)
   int currentOrders = OrdersTotal() + OrdersHistoryTotal();
   if (currentOrders != lastOrderCount) {
      SyncTrades(false);
      lastOrderCount = currentOrders;
   }
}

//+------------------------------------------------------------------+
//| Build JSON for all trades and send to STOIX                      |
//+------------------------------------------------------------------+
void SyncTrades(bool includeHistory) {
   string tradesJson = "[";
   bool first = true;
   
   // Open trades
   for (int i = 0; i < OrdersTotal(); i++) {
      if (!OrderSelect(i, SELECT_BY_POS, MODE_TRADES)) continue;
      if (OrderType() > 1) continue; // skip pending orders
      
      string tradeJson = BuildTradeJson(
         OrderTicket(),
         OrderSymbol(),
         OrderType() == OP_BUY ? "buy" : "sell",
         OrderOpenTime(),
         0,
         OrderOpenPrice(),
         0,
         OrderStopLoss(),
         OrderTakeProfit(),
         OrderLots(),
         0,
         OrderCommission(),
         OrderSwap(),
         "open"
      );
      
      if (!first) tradesJson += ",";
      tradesJson += tradeJson;
      first = false;
   }
   
   // Closed trades (history)
   if (includeHistory || OrdersHistoryTotal() > 0) {
      int historyCount = includeHistory ? OrdersHistoryTotal() : MathMin(50, OrdersHistoryTotal());
      int startIdx = includeHistory ? 0 : OrdersHistoryTotal() - historyCount;
      
      for (int i = startIdx; i < OrdersHistoryTotal(); i++) {
         if (!OrderSelect(i, SELECT_BY_POS, MODE_HISTORY)) continue;
         if (OrderType() > 1) continue; // skip pending orders
         
         string tradeJson = BuildTradeJson(
            OrderTicket(),
            OrderSymbol(),
            OrderType() == OP_BUY ? "buy" : "sell",
            OrderOpenTime(),
            OrderCloseTime(),
            OrderOpenPrice(),
            OrderClosePrice(),
            OrderStopLoss(),
            OrderTakeProfit(),
            OrderLots(),
            OrderProfit(),
            OrderCommission(),
            OrderSwap(),
            "closed"
         );
         
         if (!first) tradesJson += ",";
         tradesJson += tradeJson;
         first = false;
      }
   }
   
   tradesJson += "]";
   
   // Build full payload
   string payload = "{";
   payload += "\"trades\":" + tradesJson + ",";
   payload += "\"account_balance\":" + DoubleToString(AccountBalance(), 2) + ",";
   payload += "\"account_number\":\"" + IntegerToString(AccountNumber()) + "\"";
   payload += "}";
   
   // Send to STOIX
   SendToSTOIX(payload);
}

//+------------------------------------------------------------------+
//| Build individual trade JSON object                               |
//+------------------------------------------------------------------+
string BuildTradeJson(
   int ticket, string symbol, string tradeType,
   datetime openTime, datetime closeTime,
   double openPrice, double closePrice,
   double sl, double tp, double lots,
   double profit, double commission, double swap,
   string status
) {
   string json = "{";
   json += "\"ticket\":" + IntegerToString(ticket) + ",";
   json += "\"symbol\":\"" + symbol + "\",";
   json += "\"trade_type\":\"" + tradeType + "\",";
   json += "\"open_time\":\"" + TimeToString(openTime, TIME_DATE|TIME_SECONDS) + "\",";
   
   if (closeTime > 0) {
      json += "\"close_time\":\"" + TimeToString(closeTime, TIME_DATE|TIME_SECONDS) + "\",";
      json += "\"close_price\":" + DoubleToString(closePrice, (int)MarketInfo(symbol, MODE_DIGITS)) + ",";
      json += "\"gross_profit\":" + DoubleToString(profit, 2) + ",";
   }
   
   json += "\"open_price\":" + DoubleToString(openPrice, (int)MarketInfo(symbol, MODE_DIGITS)) + ",";
   
   if (sl > 0) json += "\"stop_loss\":" + DoubleToString(sl, (int)MarketInfo(symbol, MODE_DIGITS)) + ",";
   if (tp > 0) json += "\"take_profit\":" + DoubleToString(tp, (int)MarketInfo(symbol, MODE_DIGITS)) + ",";
   
   json += "\"lot_size\":" + DoubleToString(lots, 2) + ",";
   json += "\"commission\":" + DoubleToString(commission, 2) + ",";
   json += "\"swap\":" + DoubleToString(swap, 2) + ",";
   json += "\"status\":\"" + status + "\"";
   json += "}";
   
   return json;
}

//+------------------------------------------------------------------+
//| Send HTTP POST to STOIX Edge Function                            |
//+------------------------------------------------------------------+
void SendToSTOIX(string payload) {
   string headers = "Content-Type: application/json\r\nx-ea-key: " + STOIX_API_KEY + "\r\n";
   string result = "";
   char post[], response[];
   
   StringToCharArray(payload, post, 0, StringLen(payload));
   
   int res = WebRequest(
      "POST",
      ENDPOINT,
      headers,
      5000,
      post,
      response,
      result
   );
   
   if (res == -1) {
      int error = GetLastError();
      Print("STOIX Sync failed. Error: ", error, ". Make sure ", ENDPOINT, " is in Tools > Options > Expert Advisors > Allowed URLs");
   } else {
      string responseStr = CharArrayToString(response);
      Print("STOIX Sync success: ", responseStr);
   }
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason) {
   Print("STOIX Sync EA stopped.");
}
