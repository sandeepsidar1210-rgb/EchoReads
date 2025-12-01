import 'package:flutter/material.dart';

import 'config/api_config.dart';
import 'screens/browse_screen.dart';
import 'screens/home_screen.dart';
import 'screens/novia_chat_screen.dart';
import 'screens/preview_screen.dart';
import 'screens/purchases_screen.dart';
import 'screens/signin_screen.dart';
import 'screens/book_detail_screen.dart';
import 'models/book.dart';

void main() {
  runApp(const EchoReadsApp());
}

class EchoReadsApp extends StatelessWidget {
  const EchoReadsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EchoReads',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.teal,
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF0A0A1A),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF0F172A),
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        cardColor: const Color(0xFF111827),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: Color(0xFF020617),
          selectedItemColor: Colors.tealAccent,
          unselectedItemColor: Colors.grey,
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF111827),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF1F2937)),
          ),
          enabledBorder: const OutlineInputBorder(
            borderSide: BorderSide(color: Color(0xFF1F2937)),
          ),
          focusedBorder: const OutlineInputBorder(
            borderSide: BorderSide(color: Colors.tealAccent),
          ),
          hintStyle: const TextStyle(color: Colors.grey),
        ),
        textTheme: const TextTheme(
          bodyMedium: TextStyle(color: Colors.grey),
        ),
        useMaterial3: true,
      ),
      initialRoute: '/',
      onGenerateRoute: (settings) {
        switch (settings.name) {
          case '/':
            return MaterialPageRoute(builder: (_) => const HomeScreen());
          case SignInScreen.routeName:
            return MaterialPageRoute(builder: (_) => const SignInScreen());
          case BrowseScreen.routeName:
            return MaterialPageRoute(builder: (_) => const BrowseScreen());
          case PreviewScreen.routeName:
            return MaterialPageRoute(builder: (_) => const PreviewScreen());
          case PurchasesScreen.routeName:
            return MaterialPageRoute(builder: (_) => const PurchasesScreen());
          case NoviaChatScreen.routeName:
            return MaterialPageRoute(builder: (_) => const NoviaChatScreen());
          case BookDetailScreen.routeName:
            final book = settings.arguments as Book;
            return MaterialPageRoute(
              builder: (_) => BookDetailScreen(book: book),
            );
        }
        return null;
      },
    );
  }
}

/// Global configuration for your API base URL.
/// NOTE: For Android emulator you may need to change this to http://10.0.2.2:3000
/// instead of localhost. See [api_config.dart].
final apiBaseUrl = ApiConfig.baseUrl;
