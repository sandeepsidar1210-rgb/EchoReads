import 'package:flutter/material.dart';

import '../screens/browse_screen.dart';
import '../screens/novia_chat_screen.dart';
import '../screens/preview_screen.dart';
import '../screens/purchases_screen.dart';

class MainBottomNav extends StatelessWidget {
  final int currentIndex;

  const MainBottomNav({super.key, required this.currentIndex});

  void _onTap(BuildContext context, int index) {
    if (index == currentIndex) return;
    switch (index) {
      case 0:
        Navigator.pushReplacementNamed(context, '/');
        break;
      case 1:
        Navigator.pushReplacementNamed(context, BrowseScreen.routeName);
        break;
      case 2:
        Navigator.pushReplacementNamed(context, PreviewScreen.routeName);
        break;
      case 3:
        Navigator.pushReplacementNamed(context, NoviaChatScreen.routeName);
        break;
      case 4:
        Navigator.pushReplacementNamed(context, PurchasesScreen.routeName);
        break;
    }
  }

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      type: BottomNavigationBarType.fixed,
      onTap: (i) => _onTap(context, i),
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined),
          label: 'Home',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.menu_book_outlined),
          label: 'Browse',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.chrome_reader_mode_outlined),
          label: 'Preview',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.smart_toy_outlined),
          label: 'Novia',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.shopping_bag_outlined),
          label: 'Purchases',
        ),
      ],
    );
  }
}