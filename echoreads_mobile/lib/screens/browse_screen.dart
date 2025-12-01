import 'package:flutter/material.dart';

import '../models/book.dart';
import '../services/api_service.dart';
import '../widgets/main_bottom_nav.dart';
import 'book_detail_screen.dart';

class BrowseScreen extends StatefulWidget {
  const BrowseScreen({super.key});

  static const routeName = '/browse';

  @override
  State<BrowseScreen> createState() => _BrowseScreenState();
}

class _BrowseScreenState extends State<BrowseScreen> {
  String? _activeGenre;
  String _sort = 'latest';
  late Future<void> _initialLoad;
  List<String> _genres = [];
  List<Book> _books = [];
  bool _loading = false;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _initialLoad = _loadAll();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() => _loading = true);
    try {
      final api = ApiService.instance;
      final genres = await api.getGenres();
      final books = await api.getBooks(genre: _activeGenre, sort: _sort);
      if (!mounted) return;
      setState(() {
        _genres = genres;
        _books = books;
      });
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _reloadBooks() async {
    setState(() => _loading = true);
    try {
      final api = ApiService.instance;
      final books = await api.getBooks(genre: _activeGenre, sort: _sort);
      if (!mounted) return;
      setState(() => _books = books);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applySearchFilter() {
    final query = _searchController.text.toLowerCase();
    setState(() {
      _books = _books
          .where((b) =>
              (b.title + b.author + (b.genre ?? '')).toLowerCase().contains(query))
          .toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Browse books')),
      body: FutureBuilder<void>(
        future: _initialLoad,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting && _books.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }
          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(12.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                _GenreChip(
                                  label: 'All Genres',
                                  selected: _activeGenre == null,
                                  onTap: () {
                                    setState(() => _activeGenre = null);
                                    _reloadBooks();
                                  },
                                ),
                                ..._genres.map(
                                  (g) => _GenreChip(
                                    label: g,
                                    selected: _activeGenre == g,
                                    onTap: () {
                                      setState(() => _activeGenre = g);
                                      _reloadBooks();
                                    },
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        DropdownButton<String>(
                          value: _sort,
                          dropdownColor: const Color(0xFF111827),
                          style: const TextStyle(color: Colors.white),
                          items: [
                            const DropdownMenuItem(
                              value: 'latest',
                              child: Text('Latest',
                                  style: TextStyle(color: Colors.white)),
                            ),
                            const DropdownMenuItem(
                              value: 'popular',
                              child: Text('Most popular',
                                  style: TextStyle(color: Colors.white)),
                            ),
                            const DropdownMenuItem(
                              value: 'rated',
                              child: Text('Highly rated',
                                  style: TextStyle(color: Colors.white)),
                            ),
                          ],
                          onChanged: (value) {
                            if (value == null) return;
                            setState(() => _sort = value);
                            _reloadBooks();
                          },
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _searchController,
                      decoration: const InputDecoration(
                        hintText: 'Search by title, author, or genre',
                        hintStyle: TextStyle(color: Colors.grey),
                      ).copyWith(
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.search),
                          onPressed: _applySearchFilter,
                        ),
                      ),
                      onSubmitted: (_) => _applySearchFilter(),
                    ),
                  ],
                ),
              ),
              if (_loading) const LinearProgressIndicator(minHeight: 2),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: _reloadBooks,
                  child: _books.isEmpty
                      ? ListView(
                          children: const [
                            SizedBox(height: 120),
                            Center(
                              child: Text(
                                'No books found.',
                                style: TextStyle(color: Colors.grey),
                              ),
                            ),
                          ],
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.all(12),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            mainAxisSpacing: 12,
                            crossAxisSpacing: 12,
                            childAspectRatio: 0.6,
                          ),
                          itemCount: _books.length,
                          itemBuilder: (context, index) {
                            final book = _books[index];
                            return _BookCard(
                              book: book,
                              onTap: () {
                                Navigator.pushNamed(
                                  context,
                                  BookDetailScreen.routeName,
                                  arguments: book,
                                );
                              },
                            );
                          },
                        ),
                ),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: const MainBottomNav(currentIndex: 1),
    );
  }
}

class _GenreChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _GenreChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.black : Colors.white,
          ),
        ),
        selected: selected,
        selectedColor: Colors.tealAccent,
        backgroundColor: const Color(0xFF111827),
        onSelected: (_) => onTap(),
      ),
    );
  }
}

class _BookCard extends StatelessWidget {
  final Book book;
  final VoidCallback onTap;

  const _BookCard({required this.book, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Card(
        color: const Color(0xFF111827),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AspectRatio(
              aspectRatio: 3 / 4,
              child: ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(12)),
                child: book.imageUrl != null
                    ? Image.network(
                        book.imageUrl!,
                        fit: BoxFit.cover,
                      )
                    : Container(
                        color: Colors.grey.shade800,
                        child: const Icon(Icons.menu_book,
                            size: 48, color: Colors.white54),
                      ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    book.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    book.author,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.star,
                          size: 14, color: Colors.amberAccent),
                      const SizedBox(width: 4),
                      Text(
                        '${book.rating.toStringAsFixed(1)} (${book.totalRatings})',
                        style:
                            const TextStyle(color: Colors.grey, fontSize: 11),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '\$${book.price.toStringAsFixed(2)}',
                        style: const TextStyle(
                          color: Colors.amber,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                      TextButton(
                        onPressed: onTap,
                        child: const Text(
                          'Details & buy',
                          style: TextStyle(color: Colors.tealAccent),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
