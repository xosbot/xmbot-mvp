//+------------------------------------------------------------------+
//|                                              XMBot_EA.mq5        //|                                        XMOne Trading Platform  //|                                        AI-Powered Gold Trading     //+------------------------------------------------------------------+
#property copyright "XMOne Trading Platform"
#property version   "2.00"
#property description "AI-Powered Gold Trading EA - XMBot"
#property description "Connects to XMBot engine for signals and execution"

#include <Trade\Trade.mqh>
#include <Trade\PositionInfo.mqh>
#include <Trade\AccountInfo.mqh>
#include <Trade\SymbolInfo.mqh>

input string   EngineUrl = "http://localhost:8081";  // Engine API URL
input string   ApiKey = "";                          // API Key
input string   SymbolName = "XAUUSD";               // Trading Symbol
input double   MaxPositionSize = 1.0;               // Max Position Size (lots)
input int      MagicNumber = 999001;                // Magic Number
input int      Slippage = 20;                       // Slippage (points)
input int      PollIntervalMs = 1000;               // Poll Interval (ms)
input bool     EnableTrading = true;                // Enable Trading
input bool     EnableTrailing = true;               // Enable Trailing Stop
input double   TrailingStep = 5.0;                  // Trailing Step (points)
input double   TrailingDistance = 10.0;             // Trailing Distance (points)

CTrade         trade;
CPositionInfo  posInfo;
CAccountInfo   accInfo;
CSymbolInfo    symInfo;

string         lastSignalId = "";
double         lastSignalPrice = 0;
datetime       lastSignalTime = 0;
int            currentTicket = -1;
bool           isInitialized = false;

//+------------------------------------------------------------------+
//| Expert initialization function                                     //+------------------------------------------------------------------+
int OnInit()
{
   if(!symInfo.Name(SymbolName))
   {
      Print("ERROR: Symbol ", SymbolName, " not found");
      return INIT_FAILED;
   }
   
   trade.SetExpertMagicNumber(MagicNumber);
   trade.SetDeviationInPoints(Slippage);
   trade.SetTypeFilling(ORDER_FILLING_IOC);
   
   if(!EnableTrading)
   {
      Print("WARNING: Trading disabled - running in monitoring mode only");
   }
   
   Print("XMBot EA initialized - Symbol: ", SymbolName, " Magic: ", MagicNumber);
   isInitialized = true;
   return INIT_SUCCEEDED;
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                    //+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("XMBot EA deinitialized - Reason: ", reason);
}

//+------------------------------------------------------------------+
//| Expert tick function                                               //+------------------------------------------------------------------+
void OnTick()
{
   if(!isInitialized || !EnableTrading) return;
   
   symInfo.RefreshRates();
   
   // Check existing position for trailing stop
   if(currentTicket >= 0)
   {
      CheckTrailingStop();
      CheckPositionExists();
   }
   
   // Poll engine for signals
   static datetime lastPoll = 0;
   if(TimeCurrent() - lastPoll >= PollIntervalMs / 1000)
   {
      lastPoll = TimeCurrent();
      PollEngineSignals();
   }
}

//+------------------------------------------------------------------+
//| Poll engine for trading signals                                    //+------------------------------------------------------------------+
void PollEngineSignals()
{
   // This would normally make an HTTP request to the engine
   // For now, we use a simplified local signal generation
   // In production, this calls GET /api/signals/latest
   
   MqlRates rates[];
   int copied = CopyRates(SymbolName, PERIOD_M5, 0, 100, rates);
   if(copied < 50) return;
   
   // Simple RSI + MA signal for demonstration
   double rsi = CalculateRSI(rates, 14);
   double ma5 = CalculateMA(rates, 5);
   double ma20 = CalculateMA(rates, 20);
   
   string signal = "HOLD";
   double signalPrice = rates[copied-1].close;
   
   // Buy signal: RSI < 30 and MA5 > MA20
   if(rsi < 30 && ma5 > ma20)
   {
      signal = "BUY";
   }
   // Sell signal: RSI > 70 and MA5 < MA20
   else if(rsi > 70 && ma5 < ma20)
   {
      signal = "SELL";
   }
   
   if(signal == "HOLD") return;
   
   // Check if this is a new signal
   string signalId = signal + "_" + TimeToString(TimeCurrent(), TIME_DATE|TIME_SECONDS);
   if(signalId == lastSignalId) return;
   
   lastSignalId = signalId;
   lastSignalPrice = signalPrice;
   lastSignalTime = TimeCurrent();
   
   ExecuteSignal(signal, signalPrice);
}

//+------------------------------------------------------------------+
//| Execute a trading signal                                           //+------------------------------------------------------------------+
void ExecuteSignal(string signal, double price)
{
   // Close existing position if opposite signal
   if(currentTicket >= 0)
   {
      if((signal == "BUY" && posInfo.PositionType() == POSITION_TYPE_SELL) ||
         (signal == "SELL" && posInfo.PositionType() == POSITION_TYPE_BUY))
      {
         ClosePosition();
      }
      else
      {
         return; // Already in same direction
      }
   }
   
   if(signal == "BUY")
   {
      double sl = price - TrailingDistance * symInfo.Point();
      double tp = price + TrailingDistance * 2 * symInfo.Point();
      
      if(trade.Buy(0.1, SymbolName, price, sl, tp, "XMBot BUY"))
      {
         currentTicket = trade.ResultOrder();
         Print("BUY executed - Ticket: ", currentTicket, " Price: ", price);
      }
      else
      {
         Print("BUY failed - Error: ", trade.ResultRetcode());
      }
   }
   else if(signal == "SELL")
   {
      double sl = price + TrailingDistance * symInfo.Point();
      double tp = price - TrailingDistance * 2 * symInfo.Point();
      
      if(trade.Sell(0.1, SymbolName, price, sl, tp, "XMBot SELL"))
      {
         currentTicket = trade.ResultOrder();
         Print("SELL executed - Ticket: ", currentTicket, " Price: ", price);
      }
      else
      {
         Print("SELL failed - Error: ", trade.ResultRetcode());
      }
   }
}

//+------------------------------------------------------------------+
//| Check and apply trailing stop                                       //+------------------------------------------------------------------+
void CheckTrailingStop()
{
   if(!EnableTrailing || currentTicket < 0) return;
   
   if(!posInfo.SelectByTicket(currentTicket)) return;
   
   double openPrice = posInfo.PriceOpen();
   double currentPrice = posInfo.PriceCurrent();
   double sl = posInfo.StopLoss();
   
   if(posInfo.PositionType() == POSITION_TYPE_BUY)
   {
      double newSL = currentPrice - TrailingDistance * symInfo.Point();
      if(currentPrice - openPrice >= TrailingStep * symInfo.Point() && 
         newSL > sl + symInfo.Point())
      {
         trade.PositionModify(currentTicket, newSL, posInfo.TakeProfit());
      }
   }
   else if(posInfo.PositionType() == POSITION_TYPE_SELL)
   {
      double newSL = currentPrice + TrailingDistance * symInfo.Point();
      if(openPrice - currentPrice >= TrailingStep * symInfo.Point() && 
         (sl == 0 || newSL < sl - symInfo.Point()))
      {
         trade.PositionModify(currentTicket, newSL, posInfo.TakeProfit());
      }
   }
}

//+------------------------------------------------------------------+
//| Check if position still exists                                      //+------------------------------------------------------------------+
void CheckPositionExists()
{
   if(currentTicket < 0) return;
   
   if(!posInfo.SelectByTicket(currentTicket))
   {
      Print("Position ", currentTicket, " closed externally");
      currentTicket = -1;
   }
}

//+------------------------------------------------------------------+
//| Close current position                                              //+------------------------------------------------------------------+
void ClosePosition()
{
   if(currentTicket < 0) return;
   
   if(trade.PositionClose(currentTicket))
   {
      Print("Position closed - Ticket: ", currentTicket);
      currentTicket = -1;
   }
   else
   {
      Print("Close failed - Error: ", trade.ResultRetcode());
   }
}

//+------------------------------------------------------------------+
//| Calculate RSI                                                      //+------------------------------------------------------------------+
double CalculateRSI(const MqlRates &rates[], int period)
{
   int size = ArraySize(rates);
   if(size < period + 1) return 50.0;
   
   double gains = 0, losses = 0;
   for(int i = size - period; i < size; i++)
   {
      double change = rates[i].close - rates[i-1].close;
      if(change > 0) gains += change;
      else losses -= change;
   }
   
   if(losses == 0) return 100.0;
   double rs = gains / losses;
   return 100.0 - (100.0 / (1.0 + rs));
}

//+------------------------------------------------------------------+
//| Calculate Moving Average                                           //+------------------------------------------------------------------+
double CalculateMA(const MqlRates &rates[], int period)
{
   int size = ArraySize(rates);
   if(size < period) return rates[size-1].close;
   
   double sum = 0;
   for(int i = size - period; i < size; i++)
   {
      sum += rates[i].close;
   }
   return sum / period;
}

//+------------------------------------------------------------------+
//| OnTrade - Event handler for trade events                           //+------------------------------------------------------------------+
void OnTrade()
{
   // Update current ticket if position was closed
   if(currentTicket >= 0 && !posInfo.SelectByTicket(currentTicket))
   {
      currentTicket = -1;
   }
}

//+------------------------------------------------------------------+
//| Get account info for engine sync                                   //+------------------------------------------------------------------+
string GetAccountInfo()
{
   string info = "{";
   info += "\"balance\":" + DoubleToString(accInfo.Balance(), 2) + ",";
   info += "\"equity\":" + DoubleToString(accInfo.Equity(), 2) + ",";
   info += "\"margin\":" + DoubleToString(accInfo.Margin(), 2) + ",";
   info += "\"free_margin\":" + DoubleToString(accInfo.FreeMargin(), 2) + ",";
   info += "\"leverage\":" + IntegerToString(accInfo.Leverage()) + ",";
   info += "\"currency\":\"" + accInfo.Currency() + "\"";
   info += "}";
   return info;
}
//+------------------------------------------------------------------+