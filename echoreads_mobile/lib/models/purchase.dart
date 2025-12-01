import 'book.dart';

class Purchase {
  final String id;
  final double price;
  final DateTime createdAt;
  final Book? book;

  Purchase({
    required this.id,
    required this.price,
    required this.createdAt,
    this.book,
  });

  factory Purchase.fromJson(Map<String, dynamic> json) {
    final bookJson = json['book'];
    return Purchase(
      id: (json['_id'] ?? json['id']).toString(),
      price: (json['price'] is int)
          ? (json['price'] as int).toDouble()
          : (json['price'] ?? 0.0).toDouble(),
      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),
      book: bookJson is Map<String, dynamic> ? Book.fromJson(bookJson) : null,
    );
  }
}
