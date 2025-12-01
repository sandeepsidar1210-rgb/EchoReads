import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../models/book.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import 'preview_screen.dart';
import 'signin_screen.dart';

class BookDetailScreen extends StatefulWidget {
  const BookDetailScreen({super.key, required this.book});

  static const routeName = '/book';

  final Book book;

  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen> {
  EchoUser? _user;
  bool _processing = false;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final u = await AuthService.instance.currentUser();
    if (!mounted) return;
    setState(() => _user = u);
  }

  Future<void> _ensureSignedIn() async {
    if (_user != null) return;
    await Navigator.pushNamed(context, SignInScreen.routeName);
    await _loadUser();
  }

  Future<void> _addToCart() async {
    await _ensureSignedIn();
    if (_user == null) return;
    setState(() => _processing = true);
    try {
      await ApiService.instance.addToCart(
        userId: _user!.userId,
        bookId: widget.book.id,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Added to cart: ${widget.book.title}')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Failed to add to cart')));
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  Future<void> _buyNow() async {
    await _ensureSignedIn();
    if (_user == null) return;
    setState(() => _processing = true);
    try {
      await ApiService.instance.purchase(
        userId: _user!.userId,
        bookId: widget.book.id,
        price: widget.book.price,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Purchase successful!')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Purchase failed. Please try again.')),
      );
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final book = widget.book;
    return Scaffold(
      appBar: AppBar(title: Text(book.title)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: book.imageUrl != null
                    // PASTE THIS PART:
                    ? (book.imageUrl!.endsWith('.svg') || book.imageUrl!.contains('placehold.co')
                          ? SvgPicture.network(
                              book.imageUrl!,
                              height: 260,
                              fit: BoxFit.cover,
                              placeholderBuilder: (context) => const Center(child: CircularProgressIndicator()),
                            )
                          : Image.network(
                              book.imageUrl!,
                              height: 260,
                              fit: BoxFit.cover,
                            ))
                    : Container(
                        height: 260,
                        width: 180,
                        color: Colors.grey.shade800,
                        child: const Icon(
                          Icons.menu_book,
                          size: 64,
                          color: Colors.white70,
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              book.title,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'by ${book.author}',
              style: const TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.star, color: Colors.amber, size: 18),
                const SizedBox(width: 4),
                Text(
                  '${book.rating.toStringAsFixed(1)} (${book.totalRatings} ratings)',
                  style: const TextStyle(color: Colors.grey),
                ),
                const SizedBox(width: 12),
                if (book.genre != null)
                  Chip(
                    label: Text(book.genre!),
                    backgroundColor: const Color(0xFF1F2937),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              '4${book.price.toStringAsFixed(2)}',
              style: const TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: Colors.amber,
              ),
            ),
            const SizedBox(height: 16),
            if (book.summary != null)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Summary',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    book.summary!,
                    style: const TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            TextButton.icon(
              onPressed: () {
                Navigator.pushNamed(
                  context,
                  PreviewScreen.routeName,
                  arguments: book.id,
                );
              },
              icon: const Icon(
                Icons.chrome_reader_mode_outlined,
                color: Colors.tealAccent,
              ),
              label: const Text(
                'Read preview',
                style: TextStyle(color: Colors.tealAccent),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: SafeArea(
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
          decoration: const BoxDecoration(
            color: Color(0xFF020617),
            border: Border(top: BorderSide(color: Color(0xFF1F2937))),
          ),
          child: Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: _processing ? null : _addToCart,
                  child: const Text('Add to cart'),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  onPressed: _processing ? null : _buyNow,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.amber,
                    foregroundColor: Colors.black,
                  ),
                  child: const Text('Buy now'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
