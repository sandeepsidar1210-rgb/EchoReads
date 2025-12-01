import 'package:flutter/material.dart';

import '../services/auth_service.dart';
import '../widgets/main_bottom_nav.dart';
import 'browse_screen.dart';
import 'novia_chat_screen.dart';
import 'purchases_screen.dart';
import 'signin_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? _userName;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await AuthService.instance.currentUser();
    if (!mounted) return;
    setState(() {
      _userName = user?.name;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('EchoReads'),
        actions: [
          if (_userName != null) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4.0),
              child: Center(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade800,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text('Signed in as $_userName'),
                ),
              ),
            ),
            IconButton(
              tooltip: 'Sign out',
              icon: const Icon(Icons.logout),
              onPressed: () async {
                await AuthService.instance.signOut();
                if (!mounted) return;
                setState(() {
                  _userName = null;
                });
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Signed out')),
                );
              },
            ),
          ]
          else
            TextButton(
              onPressed: () {
                Navigator.pushNamed(context, SignInScreen.routeName)
                    .then((_) => _loadUser());
              },
              child: const Text('Sign in'),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            const Text(
              'EchoReads: Your Next Story Awaits.',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Dive into reading online, explore previews and manage your purchases directly from your phone.',
              style: TextStyle(color: Color(0xFF9CA3AF)),
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                ElevatedButton.icon(
                  onPressed: () =>
                      Navigator.pushNamed(context, BrowseScreen.routeName),
                  icon: const Icon(Icons.menu_book_outlined),
                  label: const Text('Start Reading Free'),
                ),
                OutlinedButton.icon(
                  onPressed: () => Navigator.pushNamed(
                      context, NoviaChatScreen.routeName),
                  icon: const Icon(Icons.smart_toy_outlined),
                  label: const Text('Talk to Novia AI'),
                ),
                OutlinedButton.icon(
                  onPressed: () => Navigator.pushNamed(
                      context, PurchasesScreen.routeName),
                  icon: const Icon(Icons.shopping_bag_outlined),
                  label: const Text('My Purchases'),
                ),
              ],
            ),
            const SizedBox(height: 32),
            const Text(
              'Features',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 12),
            _FeatureTile(
              icon: Icons.smart_toy_outlined,
              title: 'Novia AI Assistant',
              subtitle:
                  'Ask for recommendations or chat about books, just like on the web.',
            ),
            _FeatureTile(
              icon: Icons.chrome_reader_mode,
              title: 'Online Preview',
              subtitle:
                  'Read a long text preview of any book before you decide to buy.',
            ),
            _FeatureTile(
              icon: Icons.shopping_cart_checkout,
              title: 'Cart & Purchases',
              subtitle:
                  'Buy books using the same backend as the EchoReads website.',
            ),
          ],
        ),
      ),
      bottomNavigationBar: const MainBottomNav(currentIndex: 0),
    );
  }
}

class _FeatureTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _FeatureTile({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.tealAccent),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: const TextStyle(color: Color(0xFF9CA3AF)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
