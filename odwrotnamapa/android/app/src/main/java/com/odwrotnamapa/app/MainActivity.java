package com.odwrotnamapa.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Domyślnie WebView na Androidzie potrafi przechwytywać
        // dotyk jednym palcem na elementach wyglądających jak
        // kontener przewijalny (nawet gdy nie ma czego przewijać),
        // zanim dotrze on do JavaScriptu na stronie - stąd
        // przeciąganie za treść panelu nie działało jednym palcem,
        // ale działało dwoma. Wyłączenie "zagnieżdżonego
        // przewijania" oddaje pełną kontrolę nad dotykiem stronie.
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.setNestedScrollingEnabled(false);
            webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);
        }
    }
}
