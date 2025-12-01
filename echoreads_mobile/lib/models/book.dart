class Book {
  final String id;
  final String title;
  final String author;
  final String? imageUrl;
  final String? description;
  final String? summary;
  final String? content;
  final double rating;
  final int totalRatings;
  final String? genre;
  final double price;

  Book({
    required this.id,
    required this.title,
    required this.author,
    this.imageUrl,
    this.description,
    this.summary,
    this.content,
    required this.rating,
    required this.totalRatings,
    this.genre,
    required this.price,
  });

  factory Book.fromJson(Map<String, dynamic> json) {
    final dynamic idRaw = json['_id'] ?? json['id'];
    return Book(
      id: idRaw?.toString() ?? '',
      title: json['title'] ?? 'Untitled',
      author: json['author'] ?? 'Unknown',
      imageUrl: json['imageUrl'] as String?,
      description: json['description'] as String?,
      summary: json['summary'] as String?,
      content: json['content'] as String?,
      rating: (json['rating'] is int)
          ? (json['rating'] as int).toDouble()
          : (json['rating'] ?? 0.0).toDouble(),
      totalRatings: (json['totalRatings'] ?? 0) as int,
      genre: json['genre'] as String?,
      price: (json['price'] is int)
          ? (json['price'] as int).toDouble()
          : (json['price'] ?? 0.0).toDouble(),
    );
  }
}
