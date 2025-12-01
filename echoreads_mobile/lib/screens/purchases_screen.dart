import 'package:flutter/material.dart';

import '../models/purchase.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../widgets/main_bottom_nav.dart';
import 'signin_screen.dart';

class PurchasesScreen extends StatefulWidget {
  const PurchasesScreen({super.key});

  static const routeName = '/purchases';

  @override
  State<PurchasesScreen> createState() => _PurchasesScreenState();
}

class _PurchasesScreenState extends State<PurchasesScreen> {
  EchoUser? _user;
  late Future<void> _loadFuture;
  List<Purchase> _purchases = [];

  @override
  void initState() {
    super.initState();
    _loadFuture = _init();
  }

  Future<void> _init() async {
    final user = await AuthService.instance.currentUser();
    if (user == null) {
      if (!mounted) return;
      await Navigator.pushNamed(context, SignInScreen.routeName);
      final after = await AuthService.instance.currentUser();
      if (!mounted) return;
      if (after == null) return;
      _user = after;
    } else {
      _user = user;
    }
    if (_user == null) return;
    final api = ApiService.instance;
    final list = await api.myPurchases(userId: _user!.userId);
    if (!mounted) return;
    setState(() => _purchases = list);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My purchases'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await AuthService.instance.signOut();
              if (!mounted) return;
              setState(() {
                _user = null;
                _purchases = [];
              });
              await Navigator.pushNamed(context, SignInScreen.routeName);
              final after = await AuthService.instance.currentUser();
              if (!mounted) return;
              if (after != null) {
                setState(() => _user = after);
                _loadFuture = _init();
              }
            },
          ),
        ],
      ),
      body: FutureBuilder<void>(
        future: _loadFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (_purchases.isEmpty) {
            return const Center(
              child: Text('No purchases yet.', style: TextStyle(color: Colors.grey)),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: _purchases.length,
            itemBuilder: (context, index) {
              final p = _purchases[index];
              final b = p.book;
              return Card(
                color: const Color(0xFF111827),
                child: ListTile(
                  leading: b?.imageUrl != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: Image.network(
                            b!.imageUrl!,
                            width: 40,
                            height: 60,
                            fit: BoxFit.cover,
                          ),
                        )
                      : const Icon(Icons.menu_book_outlined,
                          color: Colors.white54),
                  title: Text(b?.title ?? 'Unknown title',
                      style: const TextStyle(color: Colors.white)),
                  subtitle: Text(
                    b?.genre ?? '',
                    style: const TextStyle(color: Colors.grey),
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '4${p.price.toStringAsFixed(2)}',
                        style: const TextStyle(
                          color: Colors.amber,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        p.createdAt.toLocal().toIso8601String().split('T').first,
                        style:
                            const TextStyle(color: Colors.grey, fontSize: 11),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
      bottomNavigationBar: const MainBottomNav(currentIndex: 4),
    );
  }
}
