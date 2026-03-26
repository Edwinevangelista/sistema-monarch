package com.finguide.financeapp;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Android 15 (API 35) enforces edge-to-edge — this lets the WebView
    // receive the correct safe-area-inset-top/bottom values via CSS env()
    WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
  }
}
