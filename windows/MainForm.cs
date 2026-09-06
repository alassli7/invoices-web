using Microsoft.Web.WebView2.Core;
using System;
using System.Windows.Forms;

namespace WindowsApp;

public class MainForm : Form
{
    private const string WebAppUrl = "https://alassli7.github.io/invoices-web/";

    private readonly Microsoft.Web.WebView2.WinForms.WebView2 _webView;

    public MainForm()
    {
        Text = "تطبيقي الشامل";
        Width = 1000;
        Height = 700;

        _webView = new Microsoft.Web.WebView2.WinForms.WebView2
        {
            Dock = DockStyle.Fill
        };
        Controls.Add(_webView);

        Load += MainForm_Load;
    }

    private async void MainForm_Load(object? sender, EventArgs e)
    {
        await _webView.EnsureCoreWebView2Async(null);
        _webView.Source = new Uri(WebAppUrl);
    }
}
