import DodoPayments from "dodopayments";

let _dodo: DodoPayments | null = null;

export function getDodo(): DodoPayments {
  if (!_dodo) {
    _dodo = new DodoPayments({
      bearerToken: process.env.DODO_API_KEY!,
      environment: (process.env.DODO_ENVIRONMENT as "test_mode" | "live_mode") || "test_mode",
    });
  }
  return _dodo;
}
